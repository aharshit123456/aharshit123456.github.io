# Hands-on Quantum Programming at IISER Bhopal

*By Harshit Agarwal*

In June 2024, in the middle of my NISER internship, I attended the NPTEL workshop "Hands on programming on Quantum computers" at IISER Bhopal, run by the institute's QuCIS group: five days of PennyLane notebooks, from single qubits to Grover's search and real hardware models.

This post covers what the workshop taught, then goes deep on the parts I worked through and kept notes on: Bell states and measurement, universal gate sets, and the Deutsch-Jozsa algorithm derived from scratch. My notes from that week had mistakes in them, and finding them taught me as much as the notebooks did, so I list those too. It is written for engineers who know linear algebra and Python but have never touched a quantum circuit.

<div class="stat-row">
  <div class="stat"><div class="stat-num">5</div><div class="stat-label">tutorial days in the workshop repo</div></div>
  <div class="stat"><div class="stat-num">20</div><div class="stat-label">Jupyter notebooks across those days</div></div>
  <div class="stat"><div class="stat-num">97</div><div class="stat-label">commits by the two organisers, 8 to 22 June 2024</div></div>
  <div class="stat"><div class="stat-num">0.36.0</div><div class="stat-label">PennyLane version pinned in requirements.txt</div></div>
</div>

> [!NOTE]
> The notebooks, slides and figures are the workshop's material, written by the QuCIS organisers (credits at the end). I did not author any of it. Code below is short excerpts adapted from those notebooks, and each one says which notebook it comes from. The derivations and the corrections are mine, re-checked for this post. On dates: the repo README says "17 Jul - 22 Jul 2024", but the folder is named `nptel_jun'24`, every commit is from June, and my own notes page for the workshop is linked from my journal on 18 and 20 June 2024 (the 20 June entry lists Deutsch, Bernstein-Vazirani and the qutrit version as that day's work). So I am confident it ran in June 2024, and I read "Jul" as a typo.

## What the week covered

The repo is organised as one folder per day. This is the structure as committed:

| Day | Notebooks | Topics |
|---|---|---|
| 1 | `Introduction_pennylane`, `double_slit`, `random_walk_quantum_coin`, `solution1` | Qubit as a vector, unitaries, Bloch sphere, circuit depth, the measurement postulate, PennyLane devices and QNodes, a random walk driven by a Hadamard "coin" |
| 2 | `Bell_state`, `teleportation`, `superdense`, `intro_algorithms`, `solution2` | Bell states, GHZ states and depth, no-cloning, teleportation, superdense coding, phase oracles ("breaking a lock") |
| 3 | `deuch_jozha_algo`, `bernstein-vazzirani`, `qutrits_bernstein_vazzirani`, `circuit_topology` | Deutsch-Jozsa, Bernstein-Vazirani on qubits and qutrits, hardware connectivity and SWAP routing |
| 4 | `Grover_search`, `brain_storming_problem` | Grover's search, a mini-hackathon (gate identities, binary to Gray code, a 3-bit mapping) |
| 5 | `ahs-aquila-pennylane`, `neutral-atom`, `strawberry-fields-tutorial`, `npteljune2024_sf1`, `npteljune2024_sf2` | Analog Hamiltonian simulation on neutral atoms (Rydberg drive, QuEra Aquila via Amazon Braket), continuous-variable photonics in Strawberry Fields |

Day 5 includes analog Hamiltonian simulation: a chain of three atoms driven with `qml.pulse.rydberg_drive`, with a section on running it on Aquila. I don't cover day 5 here.

## The minimum math: qubits, gates, measurement

A qubit's state is a unit vector in ℂ². Everything else follows from three rules.

**State.** Two complex amplitudes, normalised:

```
|0⟩ = [1, 0]ᵀ        |1⟩ = [0, 1]ᵀ
|ψ⟩ = α|0⟩ + β|1⟩,   |α|² + |β|² = 1
```

Because a global phase is unobservable, any single-qubit state can be written with two real angles, which is what the Bloch sphere draws:

```
|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩,   θ ∈ [0, π],  φ ∈ [0, 2π)
```

`|0⟩` is the north pole, `|1⟩` the south pole, `|+⟩ = (|0⟩ + |1⟩)/√2` is on the equator.

**Gates.** Operations are unitary matrices (U†U = I), because they must keep the vector normalised. The ones used all week:

```
X = [[0, 1],     Z = [[1,  0],     H = 1/√2 · [[1,  1],
     [1, 0]]          [0, -1]]                  [1, -1]]

S = [[1, 0],     T = [[1, 0         ],
     [0, i]]          [0, e^{iπ/4}]]
```

H maps `|0⟩ → |+⟩` and `|1⟩ → |−⟩`. Two qubits live in ℂ² ⊗ ℂ² with basis `|00⟩, |01⟩, |10⟩, |11⟩`; CNOT flips the second qubit when the first is 1.

**Measurement.** The day-1 notebook states the general postulate from Nielsen and Chuang. A measurement is a set of operators {M_m}. Outcome m happens with probability

```
p(m) = ⟨ψ| M_m† M_m |ψ⟩
state after = M_m|ψ⟩ / √p(m)
completeness:  Σ_m M_m† M_m = I
```

For the usual computational-basis measurement, M₀ = |0⟩⟨0| and M₁ = |1⟩⟨1|, so p(0) = |α|² and p(1) = |β|².

The first item on my doubts list just says "Completeness problem", and this equation is where it comes from. Summing p(m) over all outcomes gives ⟨ψ| (Σ M_m† M_m) |ψ⟩, which equals 1 for every normalised state exactly when Σ M_m† M_m = I. So completeness is not an extra axiom: it is "probabilities add up to one", written for operators. The notebook's example, M₁ = |+⟩⟨+| and M₂ = |−⟩⟨−|, satisfies it because {|+⟩, |−⟩} is an orthonormal basis.

**Depth** is the number of time steps when every gate that can run in parallel does; gates on disjoint qubits share a layer. It matters because real qubits decohere with time.

## PennyLane in one screen: devices and QNodes

A **quantum function** is a plain Python function that calls gates and returns a measurement. A **device** is where it runs (`default.qubit` is the built-in simulator; plugins reach Cirq, Braket and hardware). A **QNode**, usually made with the `@qml.qnode(dev)` decorator, binds the two. Adapted from `Introduction_pennylane.ipynb`:

```python
import pennylane as qml

dev = qml.device("default.qubit", wires=[0, 1])

@qml.qnode(dev)
def circuit(theta):
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    qml.RZ(theta, wires=0)
    return qml.probs(wires=[0, 1])

print(circuit(0.2))          # probabilities of |00>, |01>, |10>, |11>
qml.draw_mpl(circuit)(0.2)   # draws the circuit
```

Two details that bit me later. Gates execute in written order, which is the reverse of the order in a matrix product. And `qml.probs` gives exact probabilities, while `qml.sample` and `qml.counts` need a device created with `shots=...`.

## Bell states and what measuring one qubit does

The day-2 notebook builds the first entangled state with two gates.

<figure>
  <div class="diagram">
    <div class="node muted-node">q0: |0⟩</div>
    <span class="arrow">→</span>
    <div class="node accent">H</div>
    <span class="arrow">→</span>
    <div class="node">CNOT control ●</div>
    <span class="arrow">→</span>
    <div class="node muted-node">measure</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">q1: |0⟩</div>
    <span class="arrow">→</span>
    <div class="node muted-node">idle</div>
    <span class="arrow">→</span>
    <div class="node">CNOT target ⊕</div>
    <span class="arrow">→</span>
    <div class="node muted-node">measure</div>
  </div>
  <figcaption><b>Fig. 1</b> — the Bell-state circuit, one row per qubit, time running left to right.</figcaption>
</figure>

Step by step:

```
|00⟩  --H on q0-->  (|0⟩ + |1⟩)/√2 ⊗ |0⟩ = (|00⟩ + |10⟩)/√2
      --CNOT-->     (|00⟩ + |11⟩)/√2 = |Φ⁺⟩
```

The four Bell states, and the gates that make each from `|00⟩` (from my notes, verified by multiplying the matrices out):

| State | Vector | Gates, in order |
|---|---|---|
| \|Φ⁺⟩ | (\|00⟩ + \|11⟩)/√2 | H(0), CNOT(0,1) |
| \|Φ⁻⟩ | (\|00⟩ − \|11⟩)/√2 | H(0), CNOT(0,1), Z(0) |
| \|Ψ⁺⟩ | (\|01⟩ + \|10⟩)/√2 | X(1), H(0), CNOT(0,1) |
| \|Ψ⁻⟩ | (\|01⟩ − \|10⟩)/√2 | X(1), H(0), CNOT(0,1), Z(0) |

The Z at the end works because Z on qubit 0 multiplies every term whose first bit is 1 by −1. In `|Ψ⁺⟩` that is the `|10⟩` term, which gives `|Ψ⁻⟩`.

In PennyLane, from `Bell_state.ipynb`:

```python
dev = qml.device("default.qubit", wires=2, shots=1000)

@qml.qnode(dev)
def bell():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.counts()   # only '00' and '11' appear, roughly 500 each
```

The second doubt on my list was exactly this: "find the probability distribution of the states when the first qubit of a two-qubit Bell state is measured". Measuring only the first qubit uses M₀ = |0⟩⟨0| ⊗ I and M₁ = |1⟩⟨1| ⊗ I:

```
p(first = 0) = ⟨Φ⁺| (|0⟩⟨0| ⊗ I) |Φ⁺⟩ = |1/√2|² = 1/2   → state becomes |00⟩
p(first = 1) = ⟨Φ⁺| (|1⟩⟨1| ⊗ I) |Φ⁺⟩ = |1/√2|² = 1/2   → state becomes |11⟩
```

The first qubit is a fair coin; afterwards the second matches it (for the Ψ states, it is the opposite bit). What confused me was whether this lets one side "send" something. It doesn't: looked at alone, the second qubit is 50/50 whether or not the first was measured. The correlation only appears when results are compared over a classical channel, which is why teleportation, later that day, needs Alice to send two classical bits. Nor is it a computational-basis trick: `|Φ⁺⟩ = (|++⟩ + |−−⟩)/√2`, so outcomes also match in the X basis.

### GHZ states and depth

Exercise 2.2 asks for `(|00000⟩ + |11111⟩)/√2`. H on qubit 0 then four CNOTs from qubit 0 works, but they all share qubit 0, so the depth is 5. Exercise 2.3 asks for less, and the solution notebook builds a tree:

```python
qml.Hadamard(wires=2)
qml.CNOT(wires=[2, 0])
qml.CNOT(wires=[2, 4])
qml.CNOT(wires=[0, 1])   # can run alongside CNOT(2, 4)
qml.CNOT(wires=[4, 3])
```

By my count that is depth 4, and it is optimal: each CNOT layer can at most double the number of qubits sharing the bit (1, 2, 4, 8), so 5 qubits need three CNOT layers plus the H. In general, 1 + ⌈log₂ n⌉ instead of n.

## Universal gate sets

The third doubt was "Universal Quantum Gate Set Problem": how do you build an arbitrary unitary from gates you actually have? My notes on this were partly wrong, so here is the version I'd keep.

**Step 1: any single-qubit unitary is three rotations.** Nielsen and Chuang (Theorem 4.1) show every 2×2 unitary can be written as

```
U = e^{iα} R_z(β) R_y(γ) R_z(δ)

R_z(φ) = [[e^{-iφ/2}, 0        ],      R_y(θ) = [[cos(θ/2), -sin(θ/2)],
          [0,         e^{iφ/2}]]                  [sin(θ/2),  cos(θ/2)]]
```

The U3 gate packages this with the global phase dropped:

```
U3(θ, φ, λ) = [[cos(θ/2),          -e^{iλ} sin(θ/2)     ],
               [e^{iφ} sin(θ/2),    e^{i(φ+λ)} cos(θ/2)  ]]

            = e^{i(φ+λ)/2} · R_z(φ) R_y(θ) R_z(λ)
```

I checked the second line numerically; the phase in front never changes a measurement.

**Step 2: read the angles off a given matrix.** Write the target as U = [[a, b], [c, d]] = e^{iα} U3(θ, φ, λ). Matching entries:

```
a = e^{iα} cos(θ/2)
b = -e^{i(α+λ)} sin(θ/2)
c = e^{i(α+φ)} sin(θ/2)

⇒  θ = 2·arccos|a|
    α = arg(a)
    φ = arg(c) − α
    λ = arg(−b) − α
```

When a = 0 (θ = π) take the phase from c instead. When b = c = 0 (θ = 0), only φ + λ is defined, and any split works.

**Where my notes went wrong**, in three easy-to-make ways:

1. My notes had λ = arg(−b) − arg(c). With α = 0 that equals λ − φ, not λ. The correct formula subtracts arg(a).
2. The PennyLane code in my notes applied `RZ(phi)`, then `RY(theta)`, then `RZ(lambda)`. Since PennyLane applies gates in written order, that circuit's matrix is R_z(λ) R_y(θ) R_z(φ), the reverse of what was intended. To get R_z(φ) R_y(θ) R_z(λ), write `RZ(lambda)` first, or use `qml.Rot(lambda, theta, phi)`, which is defined as RZ(ω)RY(θ)RZ(φ) on its arguments (φ, θ, ω).
3. The test matrix in my notes was [[0.5, −0.5], [0.5, 0.5]]. That is not unitary: U†U = I/2. The entries should be ±1/√2, which gives R_y(π/2).

**Step 3: finite gate sets.** Single-qubit unitaries plus CNOT are exactly universal. Hardware offers a finite menu, and a finite set produces only countably many circuits, so it can only approximate. Which sets are enough?

- **{H, S, CNOT}** generates the Clifford group: not universal, and by the Gottesman-Knill theorem classically simulable from basis states.
- **Clifford + T** ({H, S, CNOT, T}) is universal. Since T² = S, {H, T, CNOT} is the same set.
- **Cost.** By the Solovay-Kitaev theorem, accuracy ε takes O(logᶜ(1/ε)) gates, with c around 4 (Dawson and Nielsen give about 3.97).

My notes also built the six cardinal states: `|1⟩` (X), `|+⟩` (H), `|−⟩` (H then Z), `|i⟩` (H then S), `|−i⟩` (H then S†). The S† line used `qml.S(wires=0).inv()`, an old PennyLane API since removed; today it is `qml.adjoint(qml.S)(wires=0)`.

## Deutsch-Jozsa from scratch

This is the part I spent most time on; my notes page for it runs to about 3,200 words. Here it is, cleaned up and re-checked.

### The problem

You get a black box computing f: {0,1}ⁿ → {0,1}. You are promised f is either **constant** (same output for every input) or **balanced** (0 on exactly half the inputs, 1 on the other half). Decide which.

A deterministic classical algorithm could see 0 on the first 2ⁿ⁻¹ inputs and still not know, so it needs 2ⁿ⁻¹ + 1 queries. The quantum algorithm needs one.

### The oracle

How does a circuit "call" f? The map |x⟩ → |f(x)⟩ is not reversible (for constant f every input lands on the same output), so it cannot be unitary. Instead, keep the input and XOR the answer into an extra qubit:

```
U_f |x⟩|y⟩ = |x⟩|y ⊕ f(x)⟩
```

This permutes the basis states, so it is unitary. It is also its own inverse, because y ⊕ f(x) ⊕ f(x) = y.

For n = 1, order the basis as |x y⟩ = |00⟩, |01⟩, |10⟩, |11⟩. Column |x y⟩ of the matrix is the basis vector |x, y ⊕ f(x)⟩, which gives

```
U_f = [[1−f(0), f(0),   0,      0     ],
       [f(0),   1−f(0), 0,      0     ],
       [0,      0,      1−f(1), f(1)  ],
       [0,      0,      f(1),   1−f(1)]]

    = |0⟩⟨0| ⊗ X^{f(0)}  +  |1⟩⟨1| ⊗ X^{f(1)}
```

Each 2×2 block is I or X: the ancilla flips exactly when f(x) = 1. This is the matrix the workshop notebook's `oracle(g)` builds. The four one-bit functions:

| f | f(0), f(1) | Type | U_f | As gates |
|---|---|---|---|---|
| f(x) = 0 | 0, 0 | constant | I ⊗ I | nothing |
| f(x) = 1 | 1, 1 | constant | I ⊗ X | X on the ancilla |
| f(x) = x | 0, 1 | balanced | CNOT | CNOT(x → y) |
| f(x) = 1 ⊕ x | 1, 0 | balanced | blockdiag(X, I) | CNOT, then X on the ancilla |

My notes got the last row wrong: correctly U_f = (I ⊗ X)·CNOT, but then the product was written as the I ⊗ X matrix. It is actually [[0,1,0,0],[1,0,0,0],[0,0,1,0],[0,0,0,1]]: flip the ancilla when x = 0. The habit that catches this is checking each column by asking "where does this basis state go?"

### Phase kickback

The trick is to put the ancilla in `|−⟩ = (|0⟩ − |1⟩)/√2` instead of a basis state:

```
U_f |x⟩|−⟩ = |x⟩ (|0 ⊕ f(x)⟩ − |1 ⊕ f(x)⟩)/√2

  f(x) = 0:  |x⟩ (|0⟩ − |1⟩)/√2 = +|x⟩|−⟩
  f(x) = 1:  |x⟩ (|1⟩ − |0⟩)/√2 = −|x⟩|−⟩

⇒ U_f |x⟩|−⟩ = (−1)^{f(x)} |x⟩|−⟩
```

The ancilla comes out unchanged and the answer becomes a sign on the input. A sign on one basis state is invisible, but in a superposition it is a relative phase, and a Hadamard turns relative phases into different outcomes. The day-2 `intro_algorithms` notebook makes the same point with its "pair testing" lock: a phase flip is only detectable in the {|+⟩, |−⟩} basis.

### One input bit, the whole run

<figure>
  <div class="diagram">
    <div class="node muted-node">x: |0⟩</div>
    <span class="arrow">→</span>
    <div class="node accent">H</div>
    <span class="arrow">→</span>
    <div class="node">U_f (input)</div>
    <span class="arrow">→</span>
    <div class="node accent">H</div>
    <span class="arrow">→</span>
    <div class="node muted-node">measure</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">y: |1⟩</div>
    <span class="arrow">→</span>
    <div class="node accent">H</div>
    <span class="arrow">→</span>
    <div class="node">U_f (ancilla)</div>
    <span class="arrow">→</span>
    <div class="node muted-node">discard</div>
  </div>
  <figcaption><b>Fig. 2</b> — Deutsch's circuit. The ancilla starts in |1⟩ so that H turns it into |−⟩. U_f spans both wires.</figcaption>
</figure>

```
|ψ₀⟩ = |0⟩|1⟩
|ψ₁⟩ = (H ⊗ H)|ψ₀⟩ = |+⟩|−⟩ = (|0⟩ + |1⟩)/√2 ⊗ |−⟩
|ψ₂⟩ = U_f|ψ₁⟩     = ((−1)^{f(0)}|0⟩ + (−1)^{f(1)}|1⟩)/√2 ⊗ |−⟩
                   = (−1)^{f(0)} · (|0⟩ + (−1)^{f(0)⊕f(1)}|1⟩)/√2 ⊗ |−⟩
```

The first qubit is `|+⟩` if f(0) = f(1) and `|−⟩` if not, up to a global sign. Since H|+⟩ = |0⟩ and H|−⟩ = |1⟩:

```
|ψ₃⟩ = (H ⊗ I)|ψ₂⟩ = ±|f(0) ⊕ f(1)⟩ ⊗ |−⟩
```

Measure the first qubit: 0 means constant, 1 means balanced, with certainty. One call answered a question about f(0) and f(1) jointly without learning either.

### n input bits

Two identities do all the work. With N = 2ⁿ and x·z the bitwise inner product mod 2:

```
H^{⊗n} |0…0⟩ = (1/√N) Σ_x |x⟩
H^{⊗n} |x⟩   = (1/√N) Σ_z (−1)^{x·z} |z⟩
```

Run the same circuit with n input qubits:

```
start:          |0…0⟩|1⟩
after H's:      (1/√N) Σ_x |x⟩ ⊗ |−⟩
after U_f:      (1/√N) Σ_x (−1)^{f(x)} |x⟩ ⊗ |−⟩          (phase kickback)
after H^{⊗n}:   Σ_z [ (1/N) Σ_x (−1)^{f(x) ⊕ x·z} ] |z⟩ ⊗ |−⟩
```

Now look only at the amplitude of z = 0…0, where x·z = 0 for every x:

```
amp(0…0) = (1/N) Σ_x (−1)^{f(x)}

constant f:  every term is the same sign  → amp = ±1  → P(0…0) = 1
balanced f:  N/2 terms +1, N/2 terms −1   → amp = 0   → P(0…0) = 0
```

All zeros means constant; anything else means balanced. I checked this numerically for n = 1, 2, 3.

### The two-input oracle, and the second mistake in my notes

For n = 2 there are three qubits (two inputs, one ancilla), so U_f is 8×8, not 16×16 as my notes said. In general it is 2ⁿ⁺¹ × 2ⁿ⁺¹, and it is always block diagonal:

```
U_f = Σ_x |x⟩⟨x| ⊗ X^{f(x)}
```

For the balanced f(x₁, x₂) = x₁ ⊕ x₂, U_f = blockdiag(I, X, X, I). The 8×8 matrix in my notes for it had the wrong entries, and the notes wrote "f(x₁ ⊕ x₂)", confusing the function with one example of it. You don't need the matrix anyway: two CNOTs, one from each input onto the ancilla, add x₁ ⊕ x₂ to it.

My notes also said the algorithm decides "with high probability". On ideal hardware it is exact, which is why the workshop notebook uses `shots=1`.

### In PennyLane

Adapted from `deuch_jozha_algo.ipynb`, which passes the oracle in as a matrix:

```python
import numpy as np
import pennylane as qml

dev = qml.device("default.qubit", wires=2, shots=1)

def oracle(g):
    return np.array([[1 - g(0), g(0), 0, 0],
                     [g(0), 1 - g(0), 0, 0],
                     [0, 0, 1 - g(1), g(1)],
                     [0, 0, g(1), 1 - g(1)]])

@qml.qnode(dev)
def deutsch(U):
    qml.PauliX(wires=1)               # ancilla |0> -> |1>
    qml.Hadamard(wires=0)
    qml.Hadamard(wires=1)             # ancilla is now |->
    qml.QubitUnitary(U, wires=[0, 1])
    qml.Hadamard(wires=0)
    return qml.sample(wires=0)

deutsch(oracle(lambda x: 0))   # constant: always 0
deutsch(oracle(lambda x: x))   # balanced: always 1
```

> [!NOTE]
> The `qml.PauliX(wires=1)` line is my addition. The notebook's derivation starts from |01⟩, but the committed code applies H to both wires without flipping the ancilla first. An ancilla in |0⟩ becomes |+⟩, an eigenvector of X with eigenvalue +1, so there is no kickback and the circuit returns 0 for all four functions (I checked by multiplying out the matrices). If you run the notebook, add the X.

For n inputs I skip the matrix. My own generalisation, not from the notebook:

```python
n = 3
dev = qml.device("default.qubit", wires=n + 1, shots=1)

@qml.qnode(dev)
def deutsch_jozsa(oracle):
    qml.PauliX(wires=n)
    for w in range(n + 1):
        qml.Hadamard(wires=w)
    oracle()
    for w in range(n):
        qml.Hadamard(wires=w)
    return qml.sample(wires=range(n))

def parity():                      # balanced: f(x) = x0 ⊕ x1 ⊕ x2
    for w in range(n):
        qml.CNOT(wires=[w, n])

def constant_one():                # constant: f(x) = 1
    qml.PauliX(wires=n)
```

`constant_one` returns `000`; `parity` returns `111`. That is the bridge to the Bernstein-Vazirani notebook: for any f(x) = s·x, the amplitude formula puts all the weight on z = s, so one query reads out the hidden string s.

### What the speed-up is, and isn't

The day-3 notebook calls this an exponential speed-up, and against exact deterministic algorithms it is: 1 query against 2ⁿ⁻¹ + 1. Against randomized ones the gap mostly disappears. Query k random inputs; if f is balanced, the chance all k answers agree is 2·(1/2)ᵏ = 2¹⁻ᵏ, so ten queries push the error below 0.2% for any n. Deutsch-Jozsa is a clean demonstration of interference and phase kickback, not a useful algorithm.

## Grover's search, briefly

Day 4 follows the PennyLane demo. Mark the solution with a phase oracle, then reflect about the uniform superposition |s⟩:

```
U_ω = I − 2|ω⟩⟨ω|          (flip the sign of the marked state)
U_D = 2|s⟩⟨s| − I          (diffusion: reflect about |s⟩)
```

<figure>
  <div class="diagram">
    <div class="node muted-node">H on all wires<br>|s⟩</div>
    <span class="arrow">→</span>
    <div class="node">Oracle U_ω<br>qml.FlipSign</div>
    <span class="arrow">→</span>
    <div class="node">Diffusion U_D<br>GroverOperator</div>
    <span class="arrow">→</span>
    <div class="node accent">repeat r times</div>
    <span class="arrow">→</span>
    <div class="node muted-node">measure</div>
  </div>
  <figcaption><b>Fig. 3</b> — the Grover loop as built in the day-4 notebook.</figcaption>
</figure>

Two reflections make a rotation. With M marked items out of N and sin θ₀ = √(M/N), after r iterations the probability of measuring a marked item is sin²((2r + 1)θ₀).

- **N = 4, M = 1.** θ₀ = 30°, so one iteration gives sin²(90°) = 1. The notebook's 2-qubit diffusion circuit (H and Z on each wire, controlled-Z, H again) equals 2|s⟩⟨s| − I exactly; I multiplied it out. One trap: the rule r ≈ (π/4)√(N/M) rounds to 2 here, and two iterations overshoot to sin²(150°) = 0.25. The notebook does this case with one iteration by hand, so it is right.
- **N = 32, M = 2** (marking `00000` and `11111`). r = round((π/4)·4) = 3, and sin²(7·arcsin(1/4)) ≈ 0.961, split between the two marked states.

## Real devices: topology and routing

A simulator lets you CNOT any pair of qubits; hardware has a fixed connectivity graph. `circuit_topology.ipynb` gives a 9-qubit topology and asks what a CNOT between non-neighbours costs in SWAPs. Qubits 2 and 8 are three edges apart (2, 1, 4, 8): two SWAPs bring them together, the CNOT runs, two more restore the layout. That is 4 SWAPs, or 2(d − 1) for distance d, and each SWAP is 3 CNOTs, so routing can cost more than the algorithm.

## What tripped me up, and how each resolved

| From my notes | What was wrong or unclear | Resolution |
|---|---|---|
| "Completeness problem" | Why Σ M_m† M_m = I is required | It is exactly the condition for probabilities to sum to 1 for every state |
| Measuring the first qubit of a Bell state | The distribution, and whether it affects the other qubit | 1/2 and 1/2; the pair collapses to \|00⟩ or \|11⟩; the second qubit alone stays 50/50, so no signalling |
| Universal gate set | How to turn any U into gates | ZYZ / U3 decomposition, correct angle extraction, then Clifford + T with Solovay-Kitaev |
| U3 extraction code | Wrong λ, reversed gate order, non-unitary test matrix | λ = arg(−b) − arg(a); write RZ(λ) first; use ±1/√2 entries |
| Deutsch-Jozsa oracles | (I ⊗ X)·CNOT written as I ⊗ X; two-input oracle 16×16 | blockdiag(X, I); 8×8, blockdiag(I, X, X, I) for x₁ ⊕ x₂ |
| Observables | Claimed outcome λᵢ has probability \|aᵢ\|² for any expansion of \|ψ⟩ | Only when \|ψ⟩ is expanded in the eigenbasis of A: p(λᵢ) = \|⟨i\|ψ⟩\|², and ⟨A⟩ = Σ λᵢ p(λᵢ), which is what `qml.expval` returns |

Most of my errors came from trusting a derivation that looked right instead of checking one column or one 2×2 product. With matrices this small, that takes a minute.

## Credits

The workshop "Hands on programming on Quantum computers" was organised by the QuCIS group at IISER Bhopal as an NPTEL workshop. The repo README credits its authors as [Mainak Bhattacharyya](https://github.com/mainak-bhattacharyya) and harsh-quantum (Harsh Gupta), whose commits make up the whole repo. The introductory slides list Ankur Raina, Mainak Bhattacharyya, Harsh Gupta, Sanidhya Gupta and Anuprita Kulkarni. The workshop slides link the original repo as mainak-bhattacharyya/QuCIS_outreach, which is no longer public; my copy of the material is at [aharshit123456/QuCIS_outreach](https://github.com/aharshit123456/QuCIS_outreach). The Grover notebook follows PennyLane's own demo, and the measurement postulate and gate decomposition follow Nielsen and Chuang, *Quantum Computation and Quantum Information*.

## More from Research at NISER & IISER Bhopal

- [NISER Internship Retrospective](/blog/niser-internship-retrospective): going back to SMLAB, and what the May to October 2024 internship actually taught me.
- [From ORB Features to ORB-SLAM3](/blog/orb-slam3): how a modern visual SLAM system is built up from keypoints.
- [SLAM from the Bayes Filter Up](/blog/niser-slam-bayes-filter): the probabilistic foundations under localization and mapping.
- [A Browser Dashboard for a ROS 2 Sensor Rig](/blog/niser-ros-dashboard): watching live sensor topics from a web page.
- [Turning an iPhone into a LiDAR, IMU and GPS Sensor](/blog/niser-iphone-sensor-rig): using a phone as a cheap multi-sensor rig.
- [Field Notes on Perception for Two-Wheeler Autonomy](/blog/niser-perception-notes): notes on what perception has to handle on two wheels.
