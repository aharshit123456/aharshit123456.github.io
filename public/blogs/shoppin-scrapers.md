# The Scraper That Learned Every Store's Language

*By Harshit Agarwal*

To search across online stores, you first have to own a copy of what they sell. A visual search engine does not reach out and query ten shops the moment you snap a photo; that would be slow, fragile, and at the mercy of ten sites being up. Instead it searches its own catalogue, a single normalised table of products with their images already turned into vectors. The hard, endless work is keeping that catalogue filled from stores that each describe their products in a completely different way.

At shoppin', a fashion visual search app, I spent a good deal of my time on that pipeline. This post is about what it takes to turn many stores, each speaking its own dialect, into one clean catalogue a model can search. It is a tour of a data pipeline that starts at a web request and ends at a vector in a database.

<figure>
  <img src="/assets/shoppin/archive/vibe-search.webp" alt="shoppin' search: a text query over a grid of outfit results" style="width:100%" />
  <figcaption><b>Fig. 0</b> — the part users see: search by vibe or by photo, get matching outfits. Everything in this post is the catalogue those results are drawn from.</figcaption>
</figure>

## Every store speaks a different language

There is no universal format for "here are my products." Some stores hand it to you politely. A large family of shops runs on the same commerce platform, and that platform exposes a tidy machine-readable feed: ask for a store's product listing as structured data, page through it, and you get clean records with titles, prices, variants and image URLs. That is the easy case, and a surprising number of stores fall into it.

Most do not. Others expose their catalogue through a custom web API, or only through XML feeds, or not at all, in which case the products live inside the HTML of the pages themselves and have to be read out of the markup. And within each of those, there are endless variations: the same idea of "price" shows up under a dozen field names, in different currencies, with or without tax, as a number or a string with a symbol glued to it.

So the scraper could not be one program. It had to be an engine with multiple entry points, one per kind of source, that all fed into the same downstream pipeline. We classified sources by type and routed each to the reader that understood its dialect. Adding a new store usually meant picking the closest existing type, not writing a scraper from scratch. Over time, the common patterns of the industry, the handful of ways stores actually publish catalogues, were each mapped to a reader, and new shops slotted into one of them.

<figure><div class="diagram"><div class="node muted-node">products.json feed</div><div class="node muted-node">custom REST API</div><div class="node muted-node">XML feed</div><div class="node muted-node">raw HTML page</div><span class="arrow">→</span><div class="node">typed reader<br>per dialect</div><span class="arrow">→</span><div class="node accent">one common pipeline</div></div><figcaption><b>Fig. 1</b> — four kinds of source, one shared downstream. Adding a store means choosing a reader type, not writing a new scraper.</figcaption></figure>

> [!NOTE]
> The cleanest sources are the ones that publish a structured product feed. You request a store's catalogue as data rather than as a web page, and page through it in fixed-size chunks. The web page a human sees and the data feed behind it are often the same products in two very different wrappers; the feed is the one you want.

## The pipeline, one stage at a time

However the raw data arrives, it enters the same assembly line. Each stage does one job and hands off to the next.

<figure>
  <div class="diagram">
    <div class="node muted-node">Fetch (paginate)</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Transform</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Normalise</div>
    <span class="arrow">→</span>
    <div class="node accent">Map to catalogue</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Embed images</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Vector DB</div>
  </div>
  <figcaption><b>Fig. 2</b> — one record's journey from a store's feed to a searchable vector.</figcaption>
</figure>

**Fetch.** Pull the catalogue in pages. Catalogues are large, so you request them in fixed-size chunks and keep going until there are no more. First the list of catalogues or collections, then the products inside each.

**Transform.** Reshape whatever the source gave you into a common intermediate shape. This is where a store's idiosyncratic fields get read and lined up against the fields we actually keep.

**Normalise.** Make the values comparable. Prices are the clearest example: strip the currency symbols, convert to a single currency and a single convention about tax, and store a plain number. A catalogue where "price" means five different things is not searchable; a catalogue where price is always one comparable number is.

**Map to the catalogue.** Place each normalised record into the right rows of the database. Much of this is mechanical rules, built up one store at a time. But some fields are genuinely ambiguous: a category that does not cleanly fit our taxonomy, a label that could mean two things. For those small, ambiguous scraps we leaned on a language model to reclassify them into the right bucket, rather than hand-coding a rule for every oddity. The important restraint is scope: the model is a tidy-up step for the ambiguous remainder, not the thing parsing every record.

## Follow one product through the pipeline

An abstract diagram is easy to nod along to, so here is a record making the journey, field by field. Indian fashion brands run overwhelmingly on Shopify, and a Shopify store exposes its catalogue at a public `/products.json` endpoint. Ask for it and each product comes back as an object like this (trimmed, and with the store's identity removed):

```json
{
  "title": "Oversized Acid-Wash Tee",
  "handle": "oversized-acid-wash-tee",
  "vendor": "example-label",
  "product_type": "T-Shirts",
  "body_html": "<p><strong>Drop-shoulder, 240 GSM.</strong></p><p>100% combed cotton, garment-dyed acid wash. Model is 6'1 wearing M...</p>",
  "tags": ["men", "oversized", "acid-wash", "streetwear", "SS25", "cl-new", "drop-07", "999-1499"],
  "variants": [
    { "title": "S / Olive", "sku": "OAW-OLV-S", "price": "899.00", "compare_at_price": "1299.00", "available": true },
    { "title": "M / Olive", "sku": "OAW-OLV-M", "price": "899.00", "compare_at_price": "1299.00", "available": false },
    { "title": "S / Black", "sku": "OAW-BLK-S", "price": "899.00", "compare_at_price": "1299.00", "available": true }
  ],
  "images": [
    { "src": "https://cdn.example/.../oaw-olive-front.jpg", "width": 1200, "height": 1600 }
  ]
}
```

Now watch the data actually change at each stage.

**Fetch.** This object arrived as one entry in a page of such objects, requested in fixed-size chunks until the feed ran out.

**Transform, one listing per variant.** A product is not one sellable thing. This tee exists in olive and black, in S and M, and each of those is its own item with its own stock. So the variants fan out into separate listings, and the `body_html` wall of marketing gets its tags stripped down to a plain description (and the stray `Model is 6'1 wearing M` noise discarded).

**Normalise.** `price` is the string `"899.00"`; it becomes the number `899`. `compare_at_price` tells us it is discounted from `1299`, so we keep both selling price and MRP. The `"999-1499"` tag is the store's own price band, redundant once we have the real number, so it goes. `M / Olive` has `available: false`, a stock fact we record rather than a reason to drop the listing.

**Gender attribution.** Gender is the field search most depends on and the field feeds are least reliable about. Here a `men` tag makes it easy. But plenty of Indian catalogues carry no gender tag at all, or hide it in a collection name or the title (`Women's ...`), or mislabel unisex drops. Returning a men's tee for a "women's top" search is exactly the mistake that destroys trust, so we attribute an explicit `gender` to every listing: from a clear tag when there is one, and otherwise inferred from title, collection and the image itself. The system never has to guess gender again downstream.

**Product-type attribution.** The feed's `product_type` is the free-text string `"T-Shirts"`, whatever word the store happened to choose. It is mapped into our own taxonomy as `top > t-shirt`. And `product_type` is frequently missing, blank, `"Default"`, or a marketing phrase; when it is useless, the type is derived from the title and the detected garment instead. The store's label is a hint, never the final answer.

**Map and embed.** The remaining opaque tags (`cl-new`, `drop-07`) are the store's internal merchandising codes, meaningful to them and noise to us. This ambiguous remainder, which no per-store rules table can keep up with, is where a language model earns its place deciding what maps to something we track and what to drop. Then the olive front image is fetched, the garment detected and cropped out, and the clean crop plus the description becomes a vector.

The net effect is a vendor-specific blob in and a clean, attributed, searchable record out:

| field | raw feed | after the pipeline |
| --- | --- | --- |
| price | `"899.00"` (string) | `899` + `mrp 1299` |
| gender | `men` tag (often absent) | `gender: men` (attributed, always present) |
| type | `product_type: "T-Shirts"` | `category: top > t-shirt` |
| colour / size | buried in `variant.title` | `colour: olive`, `size: S` per listing |
| tags | `cl-new, drop-07, 999-1499` | dropped as store-internal noise |
| image | marketing hero shot | cropped garment → vector |

Multiply that by thousands of stores, each with its own dialect of the same idea, and you have the catalogue.

## Turning a product photo into something searchable

A product record is not useful to a visual search engine until its images become vectors. And a raw product photo is not quite the right input, because it usually shows a whole outfit or a model, when what someone is searching for is one garment.

So before embedding, the images were cropped down to the garments themselves. We had object detection and segmentation models, the subjects of earlier posts in this series, that find each garment in a photo and cut it out from its background. The detector gives a box around each item; segmentation refines that to the garment's actual outline. Feeding the model a clean jacket rather than a whole catalogue shot makes the resulting vector far more faithful to the thing itself.

Each cleaned garment image, together with a short textual description of the product, then went through embedding models that turn an image (and its words) into a vector: a list of numbers positioned so that visually similar items land near each other. We used strong general vision-language models for this, and earlier in the project trained our own fashion-tuned variants of the well-known image-text models so the vectors understood clothing specifically rather than images in general.

Those vectors were stored in a vector database, a store built to answer "which of my millions of vectors are nearest to this one?" quickly. That nearest-neighbour query is the entire magic trick of visual search: at request time, the user's photo becomes a vector by the same path, and the database returns the closest products. All the pipeline work above exists so that this one query has a clean, comparable, well-cropped catalogue to search.

<figure><div class="diagram"><div class="node muted-node">Catalogue image</div><span class="arrow">→</span><div class="node">detect + crop</div><span class="arrow">→</span><div class="node">embed</div><span class="arrow">→</span><div class="node accent">vector DB</div><span class="arrow">←</span><div class="node">embed</div><span class="arrow">←</span><div class="node muted-node">User's photo</div></div><figcaption><b>Fig. 3</b> — both sides meet in the same vector space. Catalogue images and the user's photo travel the same path; search is a nearest-neighbour lookup between them.</figcaption></figure>

> [!NOTE]
> An embedding is a point in a high-dimensional space where distance means similarity. "Find similar products" becomes "find nearby points." A vector database is the index that makes finding nearby points fast at scale, instead of comparing against every item one by one.

## One product, many listings, one group

A single product in a store is rarely a single thing. It comes in colours and styles: the same babydoll in black and in white, the same jeans in three washes. In the feed these show up as variants of one product, and each variant is really its own sellable item with its own image and availability. So in our catalogue each variant became its own product listing, and the listings that belong to the same source product were grouped back together. That way a search can surface the exact colour you photographed, while still knowing it is one garment offered in several.

The harder, and more valuable, grouping happens across stores. The whole promise of the app was to compare the same or similar item across many websites, and no two stores share an ID, a title or a photo for the same garment. The only thing they share is that the clothes look alike. So the grouping that matters is visual: a similarity-scoring model compares listings against each other and clusters the ones that are plausibly the same or near-identical garment from different websites. That cluster is what lets one snapshot return a row of options with prices from ten shops.

<figure><div class="diagram"><div class="node muted-node">Product<br>(many variants)</div><span class="arrow">→</span><div class="node">one listing<br>per variant</div><span class="arrow">→</span><div class="node">grouped by source product</div><span class="arrow">→</span><div class="node accent">clustered across stores<br>by visual similarity</div></div><figcaption><b>Fig. 4</b> — variants fan out into listings, regroup by product, then cluster across websites by how alike the clothes look. That cross-store cluster is "ten sites compared."</figcaption></figure>

This is where all the earlier care pays off. Grouping by appearance only works if every listing was cropped to the garment and embedded faithfully; a similarity score between two cluttered scenes is noise. Clean inputs upstream are what make a trustworthy grouping downstream.

<figure>
  <img src="/assets/shoppin/archive/style-discover.webp" alt="shoppin' style discovery: outfits grouped under style labels like 'brenton stripes' and 'old money aesthetics'" style="width:100%" />
  <figcaption><b>Fig. 5</b> — the payoff of grouping: looks clustered under styles a shopper can browse, every tile a real product drawn from the normalised catalogue.</figcaption>
</figure>

## When sites would rather you didn't

Not every store wants to be read in bulk, and some actively discourage it. A scraper that hammers a site looks nothing like a human browsing, and sites have ways of noticing and refusing automated traffic.

I will not write an evasion manual here, because the interesting engineering lesson is not any particular trick. It is that the goal was *stability*, not cleverness: the pipeline needed to fetch each catalogue reliably and politely enough that it kept working day after day, without constant firefighting. The practical version of that is to behave less like a stampede and more like a reasonable client, to respect what a site can tolerate, and to design the fetch so that when a source does push back, the failure is isolated and retried rather than taking the whole run down with it. A pipeline that quietly fetches one store's catalogue a day for a year is worth far more than a clever one that gets locked out in a week.

## Trust the data, then verify it

A catalogue that is 95 percent correct is not 95 percent as good; it is a search engine that occasionally returns the wrong price, which erodes trust fast. So the last stage was the least glamorous: validation. As each store was brought on, its data was checked, that every field we relied on was actually valid and present, that prices were sane, that images resolved, before the store's products were trusted in the live catalogue.

This is why the work went one brand at a time. It is tempting to try to write a universal scraper that handles everything at once. In practice, each new store taught the pipeline something, a new field convention, a new way prices were expressed, a new edge case, and it was only by onboarding them one at a time, validating as we went, that the engine grew genuinely robust. The generality came from accumulated specifics, not from guessing them up front.

## What I took away

- **There is no universal format; build an engine, not a scraper.** Route each source to a reader that understands its dialect, and make adding a store mean choosing a type, not starting over. The few ways the industry actually publishes catalogues can each be mapped once.
- **Normalise aggressively.** A catalogue is only searchable when every field means exactly one thing. Prices in one currency and one tax convention, categories in one taxonomy. The boring normalisation stage is what makes everything downstream possible.
- **Attribute the fields search depends on; don't trust the feed for them.** Gender and product type decide whether a result is even plausible, and feeds carry them inconsistently or not at all. Derive an explicit value for every listing, from a tag when there is one and from title, collection and image when there isn't, so nothing downstream has to guess.
- **Use a language model for the ambiguous remainder, not the bulk.** Mechanical rules handle the clean majority. Reserve the model for the genuinely ambiguous scraps, and keep its scope small enough to reason about.
- **Crop before you embed.** A vector of a whole catalogue shot is a vector of a scene. A vector of the cropped garment is a vector of the thing people actually search for. Detection and segmentation earn their place right here.
- **Aim for stable, not clever.** When a source resists bulk fetching, the win is a pipeline that fetches reliably for a year, with isolated, retried failures, not a trick that works until it is blocked.
- **Onboard one store at a time, and validate each.** Generality is accumulated, not assumed. Every store you validate makes the engine a little more robust; a universal scraper designed in the abstract rarely survives contact with the tenth real site.

A visual search demo is a photo in and products out. Behind it is a catalogue that someone had to fill, from stores that never agreed on how to describe a pair of jeans. That filling, cleaning and cropping is most of the work, and almost none of the glamour, and it is the part that decides whether the search is any good.

## More from Building shoppin'

- [shoppin' Experience](/blog/shoppin-experience): how I found shoppin', the strange application email, and the interview.
- [A Google Lens Alternative for a Job Interview, Re-Audited](/blog/shoppin-lens-research): five ways to do image similarity search, and an honest audit of my own metrics.
- [The Day I Moved a Cluster to Another Continent](/blog/shoppin-infra-terraform): the cloud setup behind search, written as code, and the day it crossed an ocean.
