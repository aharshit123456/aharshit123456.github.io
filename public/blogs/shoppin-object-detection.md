# Teaching a Model to See Clothes

*By Harshit Agarwal*

Before a visual search engine can find a jacket, it has to notice that there is a jacket. A photo from the street or a screenshot from Instagram is a scene: a person, a background, maybe three garments and a bag, all tangled together in one frame. If you embed that whole image into a vector, you get a vector of the scene, not of the jacket someone actually wants. So the first real model in the pipeline is an object detector: something that looks at a messy photo and draws a box around each piece of clothing, labelled with what it is.

At shoppin', a fashion visual search app, building and training that detector was a chunk of my work. This post is about how clothing object detection actually works, and the far less discussed part: the months of data wrangling that decide whether it works at all.

## What object detection is doing

A classifier answers "what is in this image?" with a single label. A detector answers a harder question: "what things are in this image, and where is each one?" For every object it finds, it outputs a bounding box, four numbers describing a rectangle, and a class label with a confidence score. One photo in, a list of boxes out: `top` here, `bottom` there, `shoes` at the bottom.

<figure><div class="diagram"><div class="node muted-node">Street photo<br>(a whole scene)</div><span class="arrow">→</span><div class="node accent">YOLO detector</div><span class="arrow">→</span><div class="node">top · bottom · shoes<br>each with a box</div></div><figcaption><b>Fig. 1</b> — the detector turns one tangled photo into a labelled box per garment. Everything downstream works on one garment at a time.</figcaption></figure>

We used YOLO models for this. YOLO, "you only look once," is a family of detectors built for speed: the image passes through the network once and boxes come out the other side, fast enough to run over a large catalogue and over live user photos without becoming the bottleneck. The architecture is well understood and well supported, which matters when your real problem is not the model but the data you feed it.

> [!NOTE]
> Detection gives you boxes; segmentation (the next post) refines each box into the garment's exact outline. Detection answers "there is a jacket, roughly here." Segmentation answers "and these are exactly the pixels that are the jacket." Search quality improves at every step you take toward the garment and away from the scene.

## The real work is the dataset

A detector is only as good as what it has seen. The architecture is a commodity; the training data is the moat. Fashion is a brutal domain for this, because clothing is endlessly varied: colours, textures, draping, layering, traditional and non-traditional wear, garments that look completely different on a hanger versus on a person. A model trained on a narrow slice of that variety falls apart the moment a real user photographs something it never saw.

The starting point was the public fashion detection datasets. Each is large, each is annotated differently, and no two agree on their label sets:

- **DeepFashion2** is the big one: over 491,000 images and 801,000 clothing items across 13 categories, with bounding boxes, dense landmarks, per-pixel masks, and even consumer-to-shop pairs.
- **ModaNet** offers street-style images annotated across 13 clothing and accessory classes such as bags, belts and boots.
- **Fashionpedia** goes granular, with annotations across many categories including specific garment parts like collars, sleeves and pockets.
- **Colorful Fashion** is a lighter, PASCAL VOC–formatted set covering 10 classes (sunglasses, hat, jacket, shirt, pants, shorts, skirt, dress, bag, shoe), good for quick prototyping and getting a YOLO loop running.

<div class="stat-row">
  <div class="stat"><div class="stat-num">491K+</div><div class="stat-label">images in DeepFashion2 alone</div></div>
  <div class="stat"><div class="stat-num">801K+</div><div class="stat-label">annotated clothing items</div></div>
  <div class="stat"><div class="stat-num">4</div><div class="stat-label">public datasets merged, plus our own</div></div>
  <div class="stat"><div class="stat-num">3→5</div><div class="stat-label">label classes, grown deliberately</div></div>
</div>

Putting these together is not a download; it is a project. Every dataset labels the world differently, stores annotations in a different format, and makes different assumptions about what counts as one "item." To train a single model on all of them, lakhs upon lakhs of images had to be normalised: annotations converted into one common format, class names reconciled into one shared taxonomy, and malformed or inconsistent labels cleaned up. I built the pipeline that brought these disparate sources together into one coherent training set, with custom augmentation engines that expand the data by transforming it, so the model sees each garment under many crops, flips, colour shifts and distortions rather than memorising the originals.

<figure><div class="diagram"><div class="node muted-node">DeepFashion2</div><div class="node muted-node">ModaNet</div><div class="node muted-node">Fashionpedia</div><div class="node muted-node">Hand-annotated<br>+ Roboflow</div><span class="arrow">→</span><div class="node">Normalise<br>format + labels</div><span class="arrow">→</span><div class="node">Augment</div><span class="arrow">→</span><div class="node accent">YOLO training set</div></div><figcaption><b>Fig. 2</b> — a dozen inconsistent sources become one coherent, augmented training set. This merge, not the model, is where the quality comes from.</figcaption></figure>

Then the public data ran out of usefulness, and we went further. We pulled far more images from the internet and annotated them by hand, drew the boxes ourselves on the cases the public sets did not cover. We used Roboflow for datasets and annotation tooling across clothes of all kinds, traditional and non-traditional, element by element. Every one of these got transformed into the same strict label scheme so it could join the pile.

## Start narrow, grow on purpose

A tempting mistake is to aim for a detailed taxonomy from day one: shirts versus t-shirts versus kurtas versus blouses, a class for every garment you can name. It feels thorough. In practice it is where detectors go to die, because the model spends its capacity agonising over distinctions that are ambiguous even to humans, and every rare class is starved of examples.

We did the opposite. The label set started deliberately narrow, essentially **top, bottom, shoes**, three robust classes that between them cover most of what matters in a search, and that a model can learn confidently because every class has abundant examples. Only once that was solid did we expand, carefully, adding a class or two more such as jewellery. Each new class was a decision, justified by data and need, not an aspiration. A detector that is reliably right about three things beats one that is unreliably right about thirty.

<figure><div class="diagram"><div class="node accent">top</div><div class="node accent">bottom</div><div class="node accent">shoes</div><span class="arrow">→</span><div class="node">+ jewellery</div><span class="arrow">→</span><div class="node muted-node">+ more, only<br>when earned</div></div><figcaption><b>Fig. 3</b> — the taxonomy grew on purpose. Each new class had to be justified by data and need before it was added.</figcaption></figure>

This discipline is the quiet lesson of the whole effort. The glamour is in the model; the results are in the label schema and the dataset hygiene. A clean, consistent, well-augmented set of three classes, assembled from a dozen inconsistent sources, is worth more than any architecture tweak.

## Where the box goes next

The detector's output is the hinge of the entire search pipeline. Each box it draws becomes a crop; each crop, refined by segmentation, becomes the clean garment image that gets embedded into a vector and stored for search. Get the box right and everything downstream is searching a jacket. Get it wrong, or skip it, and everything downstream is searching a scene with a jacket somewhere in it. That is the difference between a visual search that feels like magic and one that feels like a coin flip.

## What I took away

- **The model is a commodity; the dataset is the work.** YOLO is well understood and well supported. Where the months go, and where the quality comes from, is assembling, normalising and augmenting the data.
- **Normalisation across datasets is a real project.** Every public set labels the world in its own format and taxonomy. Merging them into one coherent training set is unglamorous engineering that decides whether training is even possible.
- **Augment to generalise.** A custom augmentation pipeline makes the model see each garment many ways, so it learns the garment rather than the photo.
- **Annotate the gaps yourself.** Public data gets you started and then stops being enough. Hand-annotating the cases it misses, element by element, is what covers the long tail of real clothing.
- **Start with few classes and earn each new one.** Three robust classes beat thirty flaky ones. Grow the taxonomy only when the data and the need justify it.

Detection is the least flashy model in a visual search engine and arguably the most consequential. Everything the user eventually sees is downstream of whether, in that first messy photo, the model correctly noticed the clothes.

## More from Building shoppin'

- [shoppin' Experience](/blog/shoppin-experience): how I found shoppin', the strange application email, and the interview.
- [A Google Lens Alternative for a Job Interview, Re-Audited](/blog/shoppin-lens-research): five ways to do image similarity search, and an honest audit of my own metrics.
- [The Day I Moved a Cluster to Another Continent](/blog/shoppin-infra-terraform): the cloud setup behind search, written as code, and the day it crossed an ocean.
- [The Scraper That Learned Every Store's Language](/blog/shoppin-scrapers): how product data from many kinds of shopping sites becomes one searchable catalogue.
- Segmentation and image-search embeddings are still coming.
