# A Google Lens Alternative for a Job Interview, Re-Audited

*By Harshit Agarwal*

In November 2024, shoppin' sent me an assignment before my interview: build an alternative to Google Lens. Propose four or five ways to do image similarity search, fine-tune them, compare precision, recall and retrieval accuracy, think about speed at scale, and write it all up with citations. I had about two weeks around end-semester exams. I built five embedding pipelines, three hashing attempts, a Siamese network, an autoencoder, a FastAPI and React demo, and a side project I cared about more than the brief: a **cosplay lens** that finds costumes for an anime character.

I got the job. Two years later I reopened the repo to write this post, re-read every notebook cell and its saved output, and found that several of my headline numbers were measuring something other than what the report claimed. This post explains how every method works, from the image to the vector to the nearest neighbour, and then audits my own evaluation the way I'd audit a teammate's. The bugs are the most useful part.

<div class="stat-row">
  <div class="stat"><div class="stat-num">8,677</div><div class="stat-label">Caltech-101 images indexed</div></div>
  <div class="stat"><div class="stat-num">12</div><div class="stat-label">approaches attempted</div></div>
  <div class="stat"><div class="stat-num">5</div><div class="stat-label">evaluated end to end</div></div>
  <div class="stat"><div class="stat-num">41</div><div class="stat-label">anime characters scraped</div></div>
</div>

> [!NOTE]
> Everything here comes from the public repo, [aharshit123456/lens_research](https://github.com/aharshit123456/lens_research): two Colab notebooks (`lens.ipynb`, `coslens.ipynb`), a FastAPI backend, a React frontend, a scraper and the draft report I submitted, [*Current Trends in Image Similarity Search and application in Fashion based Image Search Engine*](https://github.com/aharshit123456/lens_research/blob/master/Review_on_Image_Similarity_Search%20(4).pdf) (PDF). All commits are mine, from 30 November to 13 December 2024. Numbers quoted as "printed" are verbatim from saved notebook outputs.

## What "a Google Lens" is, technically

Strip away the product and Google Lens is **content-based image retrieval** (CBIR): given a query image, return the images in a collection that look most like it. Every approach in this post fits the same three-step shape:

<figure>
  <div class="diagram">
    <div class="node muted-node">Query image</div>
    <span class="arrow">→</span>
    <div class="node accent">Encoder<br>image → vector</div>
    <span class="arrow">→</span>
    <div class="node">Index<br>nearest neighbours</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Top-k results</div>
  </div>
  <figcaption><b>Fig. 1</b> — every method is an encoder plus an index. The catalogue goes through the same encoder once, offline.</figcaption>
</figure>

1. **Encode.** Turn each image into a fixed-length vector (an *embedding*) so that images that look alike end up close together.
2. **Index.** Store the catalogue's vectors in a structure that can answer "what's nearest to this vector?" quickly.
3. **Search.** Encode the query the same way, look up its k nearest neighbours, return those images.

Almost all of the quality comes from step 1. Almost all of the speed at scale comes from step 2. The assignment asked for different *methods*, which really means different encoders and different indexes.

## The dataset

The main benchmark was **Caltech-101**: 101 object categories (accordion, airplanes, anchor … wrench), 40 to 800 images each. I removed the `BACKGROUND_Google` class, because it is a grab bag of unrelated pictures, some containing faces that overlap with the `Faces` class. That left **8,677 images in 101 classes**.

To report results per kind of object, I grouped the 101 classes into eight parent categories using a zero-shot text classifier on the class names:

```python
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
parent_categories = ["Animals", "Appliances", "Clothes", "Vehicles",
                     "Nature", "Furniture", "Electronics", "Miscellaneous"]
# for each class name: result = classifier(name, parent_categories)
return result['labels'][0]
```

It was a neat trick, and it was wrong surprisingly often. `Faces` went to Animals, `Faces_easy` and `menorah` to Clothes, `revolver` and `stapler` to Vehicles, `watch` to Nature, `grand_piano` to Animals. The groups ended up lopsided: Animals had 35 classes, while Clothes and Appliances had 2 each. Scoring still used the fine Caltech labels, so the grouping only affects how averages are bucketed, but "Clothes" in my tables mostly means faces and a menorah. Lesson one: a zero-shot classifier on a one- or two-word label has almost no context. Ten minutes of hand-labelling would have been better.

## Encoders, part 1: pretrained CNNs

A convolutional network trained on ImageNet classification learns a hierarchy of filters: edges, then textures, then parts, then objects. If you cut off the final classification layer, the activations just before it make a strong general-purpose description of the image. This is the oldest trick in deep CBIR and it still works.

I used four Keras models, all with ImageNet weights, `include_top=False` (no classifier) and global max pooling, so each image becomes one vector:

| Model | Embedding size | Notes |
|---|---|---|
| ResNet50 | 2048 | Residual connections; the classic feature extractor |
| VGG16 | 512 | Old and heavy, but simple features |
| EfficientNetV2-B0 | 1280 | Compound-scaled; much smaller and faster |
| MobileNetV2 | 1280 | Built for phones; depthwise-separable convolutions |

```python
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input

model = ResNet50(weights="imagenet", include_top=False, pooling="max",
                 input_shape=(224, 224, 3))
img = preprocess_input(np.array(pil_image.resize((224, 224)))[None])
vector = model.predict(img).flatten()   # shape (2048,)
```

The one line that matters most there is `preprocess_input`. Every Keras model expects its inputs normalised the way it saw them in training. ResNet50 and VGG16 subtract per-channel ImageNet means in BGR order, MobileNetV2 scales to [-1, 1], and EfficientNetV2 does its own rescaling inside the model. Feed a model the wrong normalisation and its features drift in ways no error message reports. I did exactly that with MobileNet, which comes up again in the results.

### What CNN features get wrong

CNN features from a classifier are biased toward **shape and texture**, not meaning. The best illustration in my notebook is a spoon:

<figure>
  <img src="/assets/shoppin/lens/spoon-query-results.webp" alt="A spoon query image on the left; the top five results on the right are three wrenches, a headset and a ceiling fan" style="width:100%; border-radius: 6px;" />
  <figcaption><b>Fig. 2</b> — an early CNN-feature run (probably ResNet50 features, judging by the cell next to it). A spoon returns three wrenches, a headset and a ceiling fan. One wrench is grayscale, drawn with matplotlib's default colour map.</figcaption>
</figure>

To the network, a spoon is an elongated, shiny, metal object on a white background, and so is a wrench. This is the core weakness of using ImageNet classifier features for shopping: two products can look alike in silhouette and be completely different things, and the same product can look different photographed on a model versus flat on a table.

## Encoders, part 2: vision transformers

A **Vision Transformer** (ViT) cuts the image into 16×16 patches, treats each patch like a word token, and runs a transformer over the sequence. A special `[CLS]` token attends to every patch, and its final state summarises the image. That summary vector is the embedding. I tried three transformer encoders through Hugging Face `transformers`:

| Model | Checkpoint | Size | How it was trained |
|---|---|---|---|
| ViT | `google/vit-base-patch16-224` | 768 | Supervised classification (ImageNet-21k, then ImageNet-1k) |
| DINOv2 | `facebook/dinov2-base` | 768 | Self-supervised: no labels, the model learns by matching views of the same image |
| CLIP | `openai/clip-vit-base-patch32` | 512 | Contrastive image–text: images and their captions are pulled together in one space |

```python
from transformers import AutoImageProcessor, AutoModel

processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
model = AutoModel.from_pretrained("facebook/dinov2-base")

inputs = processor(images=pil_image, return_tensors="pt")
with torch.no_grad():
    vector = model(**inputs).last_hidden_state[:, 0]   # the CLS token, shape (1, 768)
```

For CLIP the call is `model.get_image_features(**inputs)`, which returns the 512-d vector in the shared image–text space.

Why should these beat CNN features?

- **DINOv2** was trained specifically to produce features that work without fine-tuning: its objective makes two crops of the same image agree, across 142 million curated images. That's close to what retrieval needs, "same thing, different photo".
- **CLIP** learned from 400 million image–caption pairs, so its space is organised by *meaning a human would describe*, not just texture. The bonus for a shopping product is that a text query lands in the same space: "red bodycon knit dress" can search an image index directly.
- **ViT** is a supervised classifier like the CNNs, but its global attention sees the whole image at once rather than building up from local filters.

## Indexes: finding the nearest vectors

Once every catalogue image is a vector, search is "find the k vectors closest to the query vector". I used scikit-learn's `NearestNeighbors` with k = 5: a **k-d tree** with Euclidean (L2) distance for the CNN features, and a **ball tree** for the transformer features.

```python
from sklearn.neighbors import NearestNeighbors

index = NearestNeighbors(n_neighbors=5, algorithm="kd_tree", metric="euclidean")
index.fit(feature_list)                       # (8677, 2048) for ResNet50
distances, ids = index.kneighbors(query_vector[None])
```

Both trees work by splitting space into regions and skipping regions that can't contain a closer point. That works well in 2 or 10 dimensions. In 768 or 2048 dimensions it barely helps: high-dimensional points are all roughly equidistant, so almost no region can be ruled out and the tree ends up visiting nearly everything. At 8,677 images a plain brute-force scan is just as fast. Trees don't make this scale; approximate methods do (more on that below).

Two smaller choices are worth knowing:

- **Cosine vs Euclidean.** For embeddings, the angle between vectors usually matters more than their length. If you L2-normalise every vector first, Euclidean distance ranks results exactly like cosine similarity, so normalise once at index time and use either. I didn't normalise.
- **PCA.** I computed a 100-component PCA of the features, which would shrink the index 20× and speed up every distance calculation, but the index was then fit on the raw features. That cell did nothing.

## Locality-sensitive hashing

**Locality-sensitive hashing** (LSH) is the classic answer to "trees don't work in high dimensions". The idea for cosine similarity is random hyperplanes: pick a random vector *r*; the bit `sign(r · x)` says which side of that hyperplane *x* falls on. Two vectors with a small angle between them land on the same side of most random hyperplanes. Take 10 such bits and you have a 10-bit hash where similar vectors usually collide. Build 5 independent tables to reduce the chance that a true neighbour lands in a different bucket every time. At query time you only compare against the vectors in the query's buckets, not the whole catalogue.

I tried it three ways, and none produced a usable result:

1. **Hand-written random projections**, 10 bits × 5 tables. The cell errors with `shapes (10,1280) and (128,) not aligned`: the hyperplanes were built for 1280-d EfficientNet vectors and the query was a 128-d PCA vector.
2. **The `sparselsh` library**, `LSH(hash_size=10, input_dim=1280, num_hashtables=5)`. This ran and printed `Precision: 0.00`. The bug was in my scoring: I compared each result's full file path to the class name, which never matches.
3. **`datasketch`'s `MinHashLSH`** on PCA-compressed ViT vectors, which printed "No similar images found." MinHash estimates *Jaccard similarity between sets*. It's the right tool for near-duplicate text or shingles and the wrong tool for dense float vectors.

My draft report had an LSH results table. It was an exact copy of the k-NN table. That was a placeholder I never replaced, and it should never have looked like a result.

## Deep metric learning: a Siamese network with triplet loss

Pretrained features are general. **Metric learning** trains the embedding directly for "these two are the same thing". A Siamese network runs a shared encoder over an *anchor*, a *positive* (same class) and a *negative* (different class), and the **triplet loss** pushes the anchor closer to the positive than to the negative by a margin:

```text
L(a, p, n) = max( ‖f(a) − f(p)‖² − ‖f(a) − f(n)‖² + margin, 0 )
```

My setup: ResNet50 frozen up to `conv5_block1_out`, then Dense 512 → 256 → 256 trainable layers, 200×200 inputs, margin 0.5, Adam at 1e-4, and 4,310 anchor–positive pairs from Caltech-101 with random negatives.

It trained for four epochs before I stopped it partway through the fifth. Loss went 0.448 → 0.207 → 0.194 → 0.152 and validation loss 0.336 → 0.324 → 0.279 → 0.255, so it was learning. But each epoch took 43 to 48 minutes at about 25 seconds a step, which means it was running on CPU, and the sanity check at the end was telling. The cosine similarity of an anchor to its positive was **0.996** and to its negative **0.994**. Everything was still crowded into one tiny region of the space. A triplet model needs many more epochs, and above all **hard negatives** (negatives that currently sit close to the anchor), before it separates classes. I never evaluated it for retrieval.

## Autoencoders

An **autoencoder** compresses an image to a small latent vector and reconstructs it, trained only on reconstruction error. The latent vector can serve as an embedding. Mine was a convolutional autoencoder on grayscale images, and it never trained: the input was 377×510, and three rounds of 2× pooling and 2× upsampling produce 384×512, so the loss compared tensors of different shapes. The fix is to resize inputs to a multiple of 2ⁿ (or crop the output). The more important point is that autoencoders are a weak choice here anyway: reconstruction rewards remembering pixels and lighting, not what an object *is*.

## How I measured, and what the measurement got wrong

Here is the scoring code, which is identical in every evaluation cell:

```python
true_labels = [1 if label == ground_truth_label else 0 for label in predicted_labels]
precision = precision_score(true_labels, [1] * len(true_labels), zero_division=1)
recall    = recall_score(true_labels,    [1] * len(true_labels), zero_division=1)
ndcg      = ndcg_score([true_labels], [[1] * len(true_labels)])
```

For each query I took the 5 nearest neighbours and marked each as relevant if it shared the query's Caltech class. About three random queries per class were drawn, around 303 queries in total, and the scores were averaged. Reading it again, there are five problems:

1. **Precision is fine: it's precision@5.** It's the share of the 5 results that come from the right class.
2. **Recall is always 1.00, by construction.** Every result is "predicted positive", so there are never false negatives, and the zero-hit case returns 1 because of `zero_division=1`. Real recall@k asks what fraction of *all* relevant images in the catalogue appear in the top k. For a class with 80 images and k = 5, the best possible recall@5 is 0.06. Every "Recall: 1.00" in my report is an artefact.
3. **nDCG ignores ranking.** Passing the same score for all five results makes every ordering a tie, so this nDCG is just a rescaled hit count. It can't tell "right answer first" from "right answer fifth".
4. **Queries were drawn from the index.** Each query image is also in the catalogue, at distance 0 from itself, so the first result is always the query. That's one free hit in five: precision can't drop below 0.20.
5. **Retrieval time only timed the encoder.** The timer wrapped `model.predict` (or the transformer forward pass). The nearest-neighbour search ran after the timer stopped.

None of this means the encoders were bad. It means the table measured less than it claimed. The fix is standard: **hold out queries** (or exclude the query from its own results), report **precision@k, recall@k and mAP** with real definitions, compute nDCG from the actual similarity scores, and time the whole request.

## The numbers, re-read

Because exactly one of the five results is always the query itself, the precision **excluding self-matches** can be recovered from the printed precision@5 *p* as (5*p* − 1) / 4. These are the evaluations that actually printed results:

| Encoder | Printed precision@5 | Precision without the self-match | Printed time (encoder only) |
|---|---|---|---|
| DINOv2 | 0.96 | ≈ 0.95 | 0.03 s |
| ViT | 0.95 | ≈ 0.94 | 0.88 s |
| EfficientNetV2-B0 | 0.90 | ≈ 0.88 | 0.07 s |
| CLIP | 0.89 | ≈ 0.86 | 0.02 s |

<figure>
  <div class="chart">
    <div class="bar-col">
      <div class="bar-value">0.95</div>
      <div class="bar accent" style="height: 95%;"></div>
      <div class="bar-label">DINOv2</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">0.94</div>
      <div class="bar" style="height: 94%;"></div>
      <div class="bar-label">ViT</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">0.88</div>
      <div class="bar" style="height: 88%;"></div>
      <div class="bar-label">EfficientNetV2</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">0.86</div>
      <div class="bar" style="height: 86%;"></div>
      <div class="bar-label">CLIP</div>
    </div>
  </div>
  <figcaption><b>Fig. 3</b> — precision of the top results once the query's match with itself is removed, on Caltech-101 (about 3 queries per class).</figcaption>
</figure>

The ranking survives the correction. **DINOv2 was the best encoder**, which matches what the field found: self-supervised features trained for invariance are built for retrieval. CLIP came last of the four here, which is also expected. Caltech-101 asks "which exact object category is this?", and CLIP's space is organised around how people *describe* images, which blurs fine visual distinctions. The real advantage of CLIP, text queries, never showed up in this benchmark.

The per-category runs make the gap between encoders vivid:

<figure>
  <div class="chart">
    <div class="bar-col">
      <div class="bar-value">0.88</div>
      <div class="bar accent" style="height: 88%;"></div>
      <div class="bar-label">ViT, Animals</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">0.03</div>
      <div class="bar" style="height: 3%;"></div>
      <div class="bar-label">MobileNet, Animals</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">0.98</div>
      <div class="bar accent" style="height: 98%;"></div>
      <div class="bar-label">ViT, Electronics</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">0.36</div>
      <div class="bar" style="height: 36%;"></div>
      <div class="bar-label">MobileNet, Electronics</div>
    </div>
  </div>
  <figcaption><b>Fig. 4</b> — precision without self-matches, by parent category. MobileNet's index was built with the wrong preprocessing.</figcaption>
</figure>

MobileNet's collapse (printed 0.22 for Animals, which is barely above the 0.20 that the self-match guarantees) isn't MobileNet being a bad model. Its index was built from images normalised with **VGG's** `preprocess_input`, and queries were normalised with MobileNet's. Query and catalogue vectors came from two different input distributions. That one line explains most of the "MobileNet is weak" conclusion in my draft.

Three more corrections to the [draft report](https://github.com/aharshit123456/lens_research/blob/master/Review_on_Image_Similarity_Search%20(4).pdf):

- **ResNet50's numbers** in the report (precision 0.84, and a per-category table) don't appear in any saved notebook output. ResNet50 features were extracted, but I can't find a printed evaluation, so I'm not claiming them.
- **VGG16** features were extracted and never evaluated.
- **The timings aren't comparable.** ViT at 0.88 s and DINOv2 at 0.03 s are models of the same size, so the gap says more about which runtime the Colab session had (one cell printed "GPU not available, running on CPU") than about the models. On a GPU, any of these encoders embeds an image in milliseconds.

## The cosplay lens

The assignment was about retrieval in general. What I actually wanted to build was a **cosplay searcher**: give it an anime character and get matched costume pieces from across the internet. It's a harder retrieval problem than Caltech-101, because the same character is drawn, photographed on many different people, cropped differently, and half the visual signal is a wig.

### Building the dataset

There was no dataset, so I scraped one. `scraper.py` reads a list of 41 character names (Naruto, Levi Ackerman, Nezuko, Gaara, Zoro …), queries the Google Custom Search image API with the name plus "cosplay", downloads up to 10 results per character, verifies each file opens as an image (converting the ones that don't), and writes the URLs to a CSV per character.

<figure>
  <div class="diagram">
    <div class="node muted-node">41 character names</div>
    <span class="arrow">→</span>
    <div class="node">Custom Search API<br>"name + cosplay", 10 results</div>
    <span class="arrow">→</span>
    <div class="node">Download + verify<br>with PIL</div>
    <span class="arrow">→</span>
    <div class="node accent">One folder per character</div>
  </div>
  <figcaption><b>Fig. 5</b> — the cosplay scraper. One API call per character, ten images back.</figcaption>
</figure>

The final folder had 42 classes and 288 files, of which 282 were readable by Keras. That's between 1 and 10 images per character: Gohan, Piccolo, Ryuk and Tatsumaki ended up with **one image each**. (One more small bug: the query was `keyword + "cosplay"` with no space, so Google received "Narutocosplay".) A web search for "Nezuko cosplay" also returns fan art, merchandise and screenshots, so the labels were noisy.

### Fine-tuning, and watching it overfit

The report said the cosplay models were fine-tuned. Here's what that run did: ResNet50 with ImageNet weights, every layer trainable (24 million parameters), plus Dense 256 → Dropout 0.5 → Dense 42 softmax, split 80/20 for test and then 80/20 again for validation, Adam at 1e-4, 10 epochs.

<figure>
  <img src="/assets/shoppin/lens/cosplay-finetune-curves.webp" alt="Loss and accuracy curves: training loss falls to near zero and training accuracy rises to 0.95, while validation loss rises and validation accuracy stays at 0 for all 10 epochs" style="width:100%; border-radius: 6px;" />
  <figcaption><b>Fig. 6</b> — the cosplay fine-tune. Training accuracy climbs from 0.06 to 0.95; validation accuracy is 0.0 at every epoch and validation loss rises from 7.0 to 11.3. Test accuracy: 3.12%.</figcaption>
</figure>

That is textbook overfitting, and it was predictable from the numbers alone. 24 million free parameters, about 180 training images, 42 classes and ~4 images per class means the network can simply memorise every training photo. Validation accuracy stuck at exactly zero also means many classes had no images in the validation split at all. With one to ten images per class, a random 80/20/20 split can't put every character in every split.

Then I built the search index on the model's **42-dimensional softmax outputs**. An overfit softmax is close to one-hot, and for a new image it puts nearly all its mass on the same few classes, so every query had almost the same vector. In the evaluation every one of 27 queries returned the **same five images**. Twenty-four had zero correct results.

### The confusion matrix that looked great

An earlier cosplay run, on a smaller 9-character set, produced this:

<figure>
  <img src="/assets/shoppin/lens/cosplay-confusion-matrix.webp" alt="A 9 by 9 confusion matrix for cosplay characters, almost perfectly diagonal with one off-diagonal entry" style="width:100%; max-width: 560px; border-radius: 6px;" />
  <figcaption><b>Fig. 7</b> — top-1 retrieval on 9 characters. Near-perfect, because each image's nearest neighbour is itself.</figcaption>
</figure>

It looks like 98% accuracy. It's computed by `neighbors.kneighbors(feature_list)`: querying the index with the same vectors it was built from, so every image's top-1 match is itself at distance zero. The single off-diagonal entry is a Mikasa image whose top match was filed under Levi, most likely the same picture scraped for both characters, who wear the same uniform. This is the same self-match bug as before, in its purest form. A diagonal confusion matrix from a retrieval system should make you suspicious, not happy.

### What the cosplay lens should have been

With 282 noisy images, training anything was the wrong move. The right design for that data is:

1. **No fine-tuning.** Use DINOv2 or CLIP embeddings as-is, which already worked best on Caltech-101.
2. **Use CLIP's text side.** "Nezuko Kamado cosplay" can be a query on its own, with no example image needed.
3. **Crop before embedding.** A cosplay photo is a person, a background and a costume. Detect the person, segment the garments, and embed each piece, so the haori matches haoris instead of matching the background of a convention hall.
4. **Evaluate with held-out queries** and a recall@k that can fail.

Point 3 is, more or less, what the actual job turned out to be about.

## The demo app

The repo also has a small working product: a **FastAPI** backend and a **React** frontend. You upload an image, pick a model from a dropdown (ResNet, VGG or EfficientNet), and get the five nearest Caltech-101 images, served from the frontend's `public/` folder.

<figure>
  <div class="diagram">
    <div class="node muted-node">React upload<br>+ model dropdown</div>
    <span class="arrow">→</span>
    <div class="node">FastAPI POST /search/<br>resize 224, extract features</div>
    <span class="arrow">→</span>
    <div class="node accent">Pickled k-NN index<br>5 neighbours</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Image paths<br>back to React</div>
  </div>
  <figcaption><b>Fig. 8</b> — the demo. Encoders and the index are unpickled once at startup.</figcaption>
</figure>

It worked for the default path, and a code review finds four problems:

- **One index for every model.** The backend loads a ResNet extractor and an EfficientNet extractor but a single `nearest_neighbors.pkl` fit on 2048-d ResNet vectors. Picking EfficientNet sends a 1280-d vector to a 2048-d index, which raises an error and returns HTTP 500. Picking VGG raises a `KeyError`, because that model was commented out. Each encoder needs its own index.
- **Wrong preprocessing again.** The server divides pixels by 255, while the index was built with Keras `preprocess_input`. It's the MobileNet bug in a second place.
- **`img.show()`** opens an image viewer on the server for every request. It was a debugging line I never removed.
- **Unused data loaded at startup.** `res.npy` (71 MB) is loaded and never read.

## What a production version needs

A two-week interview project and a production visual search engine differ mostly in the parts the assignment didn't ask about:

<figure>
  <div class="diagram">
    <div class="node muted-node">Photo</div>
    <span class="arrow">→</span>
    <div class="node">Detect + segment<br>each garment</div>
    <span class="arrow">→</span>
    <div class="node accent">Fashion-tuned<br>embedding</div>
    <span class="arrow">→</span>
    <div class="node">ANN index<br>HNSW / IVF-PQ</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Re-rank<br>+ filters</div>
  </div>
  <figcaption><b>Fig. 9</b> — the shape of a real fashion lens: crop first, embed per item, approximate search, then re-rank.</figcaption>
</figure>

- **Detection and segmentation first.** A street photo has several products in it. Each one needs to become its own query.
- **An embedding tuned for the domain**, trained with metric learning on real product pairs (the same item from different shops, or shown on a model and laid flat), with hard-negative mining. This is where the Siamese idea pays off, given enough data and a GPU.
- **Approximate nearest-neighbour search.** HNSW graphs or inverted-file indexes with product quantisation (FAISS, or a vector database) search millions of vectors in milliseconds, with recall you can measure and tune.
- **A catalogue that stays fresh**, which means scrapers and pipelines that keep re-embedding products as stores change them.
- **Evaluation that can fail**: held-out queries, recall@k against all relevant items, mAP, and latency measured end to end.

The rest of this series covers those parts as I worked on them at shoppin': detection, segmentation, embedding models, the infrastructure, and the scrapers.

## What I'd tell myself in 2024

- **Be suspicious of metrics that flatter you.** Recall at 1.00 for every model, and a diagonal confusion matrix, were both telling me the measurement was broken, and I read them as good news.
- **Never query with an image that's in the index**, or exclude it from its own results. This one bug inflated every number in the project.
- **Preprocessing is part of the model.** Two of the worst results in the repo were the right model fed the wrong normalisation.
- **A placeholder table is a liability.** Copying the k-NN table into the LSH section "for now" produced a results table for an experiment that scored zero.
- **Small data means no training.** With 282 images, pretrained embeddings and good cropping beat any fine-tuning I could have done.
- **The strongest result was the simplest one.** DINOv2 features plus brute-force nearest neighbours, with no training, beat everything I trained.

The assignment also asked for "4–5 methods". I attempted twelve, and five worked end to end. In hindsight, five done properly, with an evaluation that could fail, would have been a better submission than twelve with tables I hadn't checked. It still got me the job, and the [story of how that happened](/blog/shoppin-experience) is its own post.

## References

1. K. He, X. Zhang, S. Ren, J. Sun. *Deep Residual Learning for Image Recognition*. CVPR 2016. [doi:10.1109/CVPR.2016.90](https://doi.org/10.1109/CVPR.2016.90)
2. K. Simonyan, A. Zisserman. *Very Deep Convolutional Networks for Large-Scale Image Recognition*. 2015. [arXiv:1409.1556](https://arxiv.org/abs/1409.1556)
3. M. Tan, Q. V. Le. *EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks*. 2019. [arXiv:1905.11946](https://arxiv.org/abs/1905.11946)
4. A. Dosovitskiy et al. *An Image is Worth 16×16 Words: Transformers for Image Recognition at Scale*. 2021. [arXiv:2010.11929](https://arxiv.org/abs/2010.11929)
5. M. Oquab et al. *DINOv2: Learning Robust Visual Features without Supervision*. 2024. [arXiv:2304.07193](https://arxiv.org/abs/2304.07193)
6. A. Radford et al. *Learning Transferable Visual Models From Natural Language Supervision* (CLIP). 2021. [arXiv:2103.00020](https://arxiv.org/abs/2103.00020)
7. F. Schroff, D. Kalenichenko, J. Philbin. *FaceNet: A Unified Embedding for Face Recognition and Clustering* (triplet loss). CVPR 2015. [arXiv:1503.03832](https://arxiv.org/abs/1503.03832)
8. M. Charikar. *Similarity Estimation Techniques from Rounding Algorithms* (random-hyperplane LSH). STOC 2002. [doi:10.1145/509907.509965](https://doi.org/10.1145/509907.509965)
9. Y. A. Malkov, D. A. Yashunin. *Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs*. 2018. [arXiv:1603.09320](https://arxiv.org/abs/1603.09320)
10. F.-F. Li, M. Andreeto, M. Ranzato, P. Perona. *Caltech 101*. [doi:10.22002/D1.20086](https://doi.org/10.22002/D1.20086)
11. S. Lepage, J. Mary, D. Picard. *LRVS-Fashion: Extending Visual Search with Referring Instructions*. 2023. [arXiv:2306.02928](https://arxiv.org/abs/2306.02928)

## More from Building shoppin'

- [shoppin' Experience](/blog/shoppin-experience): how I found shoppin', the strange application email, and the interview.
- The next posts cover object detection, segmentation, image-search embeddings, infrastructure and Terraform, and the scrapers.
