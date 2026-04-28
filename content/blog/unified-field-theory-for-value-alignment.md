---
title: A Unified Field Theory for Value Alignment
date: 2026-04-28
category: Research
summary: A dynamical-systems view of value alignment: RLHF, DPO, and activation steering can be read as different ways of shaping a potential field over a model's latent state space.
---

# A Unified Field Theory for Value Alignment

Alignment is usually described as a problem of goals, preferences, or output distributions. That language is useful, but it hides a geometric fact: modern language models are not only choosing tokens. They are evolving through a high-dimensional latent state space, and alignment methods work by changing the direction of that evolution.

This essay sketches a unified field-theoretic view of value alignment. The core claim is simple:

> RLHF, DPO, and activation steering can all be interpreted as ways of adding an alignment force to the base generative dynamics of a model.

Under this view, alignment is not merely a classifier over good and bad outputs. It is a potential field over latent states. A successful method should not only assign high value to desirable behavior; it should also shape the local geometry so that generation trajectories remain stable under noise, distribution shift, and semantic pressure from the base model.

## From Goal Alignment to Value Dynamics

Classical AI alignment begins with a goal: specify what the system should optimize, then make the system optimize it. This picture is already unstable in simple thought experiments. The King Midas problem shows how a formally correct objective can be disastrously incomplete. Instrumental convergence suggests that many final goals can induce similar subgoals, such as resource acquisition or self-preservation. The deeper problem is not just that the objective may be wrong, but that human values are not a clean fixed utility function waiting to be copied into a machine.

This is why value alignment gradually shifted away from fixed-goal optimization toward uncertain objectives, cooperative inverse reinforcement learning, preference learning, RLHF, and DPO. These methods treat human feedback as evidence about an underlying normative structure. But they still mostly learn from behavior: demonstrations, comparisons, ratings, and preferences.

For language models, there is another reason to move beyond the goal-function picture. A pretrained LLM is better understood as an agent model in the sense of Andreas: its hidden representations compress patterns of belief, desire, intention, and action that appear in human-generated text. Generation is therefore not a direct march toward an explicit goal; it is the evolution of an internal state $h_t$ whose future behavior is shaped by semantic structure learned during pretraining.

So the alignment question becomes:

> How do we guide the trajectory of $h_t$ through latent space so that it remains in high-value regions?

## Latent Space as a Dynamical System

Let $\mathcal{H} \subseteq \mathbb{R}^D$ denote the latent representation space induced by a pretrained model. We can idealize $\mathcal{H}$ as a low-dimensional manifold embedded in a high-dimensional hidden state space. At generation step $t$, the model has a hidden state $h_t \in \mathcal{H}$.

Although token generation is discrete, residual connections and layer-wise transformations often make hidden-state evolution locally smooth. This motivates the approximation:

$$
h_{t+1} = h_t + \mathcal{F}_\theta(h_t) + \xi_t
$$

Here $\mathcal{F}_\theta(h_t)$ is the base semantic flow: the direction the pretrained model naturally follows without alignment intervention. The noise term $\xi_t$ captures sampling stochasticity, temperature, and other decoding effects.

The base model is therefore not a blank object waiting to receive values. It already has a powerful vector field: a learned semantic inertia created by pretraining. This is the source of the familiar alignment failure intuition: alignment data may be a thin spring, while pretraining distribution is a thick spring. Fine-tuning can bend local behavior, but the underlying semantic flow may continue to pull trajectories back toward pretrained patterns.

## Alignment as a Potential Field

Now introduce a scalar function:

$$
V: \mathcal{H} \to \mathbb{R}
$$

Call $V$ the alignment potential. A larger value $V(h)$ means that the latent state $h$ is more aligned with human preferences, values, or safety constraints. The gradient $\nabla_h V(h)$ then defines an alignment force: the local direction in latent space along which value increases most rapidly.

An aligned generation process can be written as:

$$
h_{t+1}^{(\text{align})}
= h_t
+ \underbrace{\mathcal{F}_\theta(h_t)}_{\text{semantic flow}}
+ \underbrace{\alpha \nabla_h V(h_t)}_{\text{alignment force}}
+ \xi_t
$$

The coefficient $\alpha > 0$ controls the coupling strength between the model's native semantic dynamics and the alignment potential. This equation is the central object of the theory. Different alignment methods correspond to different ways of constructing, internalizing, or applying $V$.

The benefit of this formulation is that it separates three questions that are often blurred together:

1. Where does the value signal come from?
2. How does that value signal create a local force in latent space?
3. Is the resulting dynamical system stable?

## RLHF as Internalized Potential

RLHF typically optimizes a policy against a learned reward model while penalizing KL divergence from a reference policy:

$$
\max_{\pi_\theta}
\mathbb{E}_{x,y \sim \pi_\theta}
\left[
r_\phi(x,y)
- \beta \log \frac{\pi_\theta(y|x)}{\pi_{\text{ref}}(y|x)}
\right]
$$

The optimal policy has the familiar Boltzmann-like form:

$$
\pi^*(y|x)
= \frac{1}{Z(x)}
\pi_{\text{ref}}(y|x)
\exp\left(\frac{r_\phi(x,y)}{\beta}\right)
$$

Taking logs and differentiating with respect to the latent state $h_t$ gives the geometric intuition:

$$
\nabla_{h_t} \log \pi^*(y|h_t)
=
\nabla_{h_t} \log \pi_{\text{ref}}(y|h_t)
+
\frac{1}{\beta}
\nabla_{h_t} V_{\text{RLHF}}(h_t)
$$

So when RLHF converges, the effective flow of the aligned model can be read as the base flow plus a learned value gradient:

$$
h_{t+1}
\approx
h_t
+ \mathcal{F}_{\text{base}}(h_t)
+ \frac{1}{\beta}\nabla_h V_{\text{RLHF}}(h_t)
$$

In this sense, RLHF internalizes a potential field into the model's parameters. The reward model and value head do not merely score outputs; they induce a deformation of the model's hidden-state dynamics.

## DPO as Contrastive Potential Shaping

DPO removes the explicit reward model, but it does not remove the potential-field structure. Its key move is to define an implicit reward through the log-ratio between the current policy and the reference policy:

$$
\hat{r}_\theta(x,y)
=
\beta
\log
\frac{\pi_\theta(y|x)}
{\pi_{\text{ref}}(y|x)}
$$

In latent space, this gives a relative divergence potential:

$$
V_{\text{DPO}}(h;y)
\triangleq
\beta
\left(
\log \pi_\theta(y|h)
- \log \pi_{\text{ref}}(y|h)
\right)
$$

DPO trains on preference pairs $(y_w, y_l)$, pushing the model to raise the implicit potential of the winning answer and lower that of the losing answer. The induced correction force has the form:

$$
\Delta h_{\text{DPO}}
\propto
\sigma(-\Delta \hat{r})
\left(
\nabla_h V_{\text{DPO}}(h;y_w)
-
\nabla_h V_{\text{DPO}}(h;y_l)
\right)
$$

Thus DPO is contrastive gradient ascent on an implicit potential. It creates a saddle-like geometry: trajectories are attracted toward regions associated with preferred continuations and repelled from regions associated with rejected continuations.

This makes DPO elegant, but it also clarifies its limitation. The potential is still inferred from finite behavioral comparisons. It can shape the model where comparisons provide signal, but it does not by itself guarantee global regularity of the value field.

## Activation Steering as Explicit Force Injection

Activation steering modifies the hidden state directly at inference time. In its simplest form, a fixed steering vector $v$ is added to the hidden state:

$$
h_{t+1}
=
h_t + \mathcal{F}(h_t) + \alpha v
$$

This is equivalent to a linear potential field:

$$
V_{\text{linear}}(h) = \langle v, h \rangle
$$

because $\nabla_h V_{\text{linear}} = v$. Unlike RLHF or DPO, steering does not need to internalize the potential into model parameters. It applies the force during inference.

More advanced steering methods can be read as sparse mixtures of linear potentials. Suppose we have a value dictionary $\mathcal{V} = \{v_1, \dots, v_M\}$ and context-dependent weights $w_i(x)$. The update becomes:

$$
h_{t+1}
=
h_t
+ \mathcal{F}(h_t)
+ \sum_{i=1}^M w_i(x) v_i
$$

The corresponding potential is:

$$
V_{\text{steer}}(h;x)
=
\sum_{i=1}^M
w_i(x)
\langle v_i, h \rangle
$$

This describes a context-activated, piecewise-linear potential field. Steering is therefore not an alien category of alignment technique. It is the explicit, inference-time version of the same field-theoretic idea.

## The Shared Equation

We can now summarize the three methods with one equation:

$$
h_{t+1}
\leftarrow
h_t
+ \mathcal{F}_{\text{base}}(h_t)
+ \alpha \mathcal{G}(h_t)
$$

The methods differ in what $\mathcal{G}(h)$ means:

- **RLHF:** $\mathcal{G}(h)$ is the internalized gradient of a reward/value model.
- **DPO:** $\mathcal{G}(h)$ is a contrastive gradient of policy-reference log-ratios.
- **Activation steering:** $\mathcal{G}(h)$ is an injected vector or sparse mixture of vectors at inference time.

This suggests that the real alignment question is not simply "which training algorithm works better?" but "what kind of potential field does the method create, and is that field geometrically stable?"

## Regularity Conditions for Stable Alignment

To analyze stability, move from the discrete update to a stochastic differential equation:

$$
dh_t
=
\left(
\mathcal{F}_\theta(h_t)
+ \alpha \nabla V(h_t)
\right)dt
+ \sigma dW_t
$$

We want the trajectory to remain, with high probability, inside a high-value region such as:

$$
\mathcal{S}
=
\{h: V(h) > V_{\min}\}
$$

By Itô's lemma, the expected infinitesimal change of $V(h_t)$ is governed by:

$$
\mathcal{L}V
=
\underbrace{\alpha \|\nabla V\|^2}_{\text{alignment work}}
+
\underbrace{\nabla V \cdot \mathcal{F}_\theta}_{\text{semantic compatibility}}
+
\underbrace{\frac{1}{2}\sigma^2 \Delta V}_{\text{curvature under noise}}
$$

For stable alignment near the boundary of the safe set, we want:

$$
\mathcal{L}V(h_t) \ge \delta > 0
$$

This gives three geometric regularity conditions:

1. **Coverage:** the gradient $\nabla V$ should not vanish near important boundary regions. If the potential is flat, the alignment system has no active guidance.
2. **Compatibility:** the base semantic flow should not strongly oppose the alignment gradient. If $\nabla V \cdot \mathcal{F}_\theta$ is too negative, pretraining inertia can overwhelm the alignment force.
3. **Continuity:** the potential should not form narrow, sharp peaks. If $\Delta V$ is highly negative, sampling noise can knock trajectories away from apparently high-value regions.

These conditions make the "spring" intuition precise. A model can look aligned on normal prompts while still being dynamically fragile: the value field may be too sparse, too opposed by semantic flow, or too sharply curved to be stable.

## Why Behavioral Alignment Is Geometrically Underdetermined

The most important consequence is that behavioral alignment is an inverse problem. From a finite set of observed preference comparisons, we try to infer an entire potential field over a high-dimensional latent manifold.

Let $\tau$ be a generation trajectory. Human judgment over that trajectory can be approximated as a line integral of a value field:

$$
\mathcal{K}V(\tau)
=
\int_\tau V(h(s))\,ds
$$

Preference data gives constraints such as:

$$
\mathcal{K}\hat{V}(\tau^+)
>
\mathcal{K}\hat{V}(\tau^-)
+ \delta
$$

But this only constrains values along the observed trajectories. The training trajectories occupy a tiny subset of the latent space. In high dimensions, finite observed curves have measure zero.

Therefore the inverse problem is infinitely underdetermined. There can exist ghost potentials $\Phi$ such that:

$$
\mathcal{K}\Phi(\tau_i) = 0
$$

for every training trajectory $\tau_i$, while $\nabla \Phi$ and $\Delta \Phi$ take arbitrary values elsewhere. In other words, $\hat{V}$ and $\hat{V} + \Phi$ are behaviorally indistinguishable on the training data, but they can have radically different geometry off-distribution.

This is the central instability:

> A behavioral alignment method cannot, in principle, distinguish a genuinely safe potential field from one that looks safe on the training trajectories but hides cliffs, traps, or reversed gradients elsewhere.

This is not just a data quantity problem. More data can reduce the blind region, but finite behavioral observations still do not uniquely determine a globally regular field. The issue is structural: behavior gives line-integral evidence, while deployment requires local geometric control.

## What This Reframes

The field-theoretic view does not say that RLHF, DPO, or steering are useless. It says that they should be evaluated as geometric interventions, not merely as preference optimizers.

It reframes several familiar observations:

- **Resistance:** the pretrained semantic flow can oppose the alignment gradient.
- **Rebound:** small perturbations can move the trajectory into regions where the learned potential has poor coverage or bad curvature.
- **Reward hacking:** the model may find trajectories that climb the learned potential while violating the intended value.
- **Distribution shift:** the ghost potential problem becomes visible when the model leaves the training trajectory set.

The practical implication is that alignment evaluation should ask not only whether a model prefers good outputs over bad ones, but whether the induced value field satisfies coverage, compatibility, and continuity in the regions where the model will actually move.

## Conclusion

Value alignment can be read as a problem of controlled generative dynamics. A pretrained model supplies a semantic flow $\mathcal{F}_\theta$. Alignment supplies a potential field $V$. The aligned system is stable only when the resulting vector field keeps generation trajectories inside high-value regions despite noise and semantic pressure.

RLHF, DPO, and activation steering are three ways of producing the same kind of object: an alignment force over latent states. Their differences matter, but their shared geometry matters more.

The hard part is not only learning which outputs humans prefer. The hard part is constructing a potential field whose gradients are present where needed, compatible with the base model's semantic dynamics, and smooth enough to remain stable under perturbation.

That is the value-dynamics perspective: alignment is not a label on behavior. It is a geometry of motion.

## References

- Norbert Wiener, "Some Moral and Technical Consequences of Automation", 1960.
- Stephen Omohundro, "The Basic AI Drives", 2008.
- Nick Bostrom, *Superintelligence: Paths, Dangers, Strategies*, 2014.
- Dylan Hadfield-Menell, Stuart Russell, Pieter Abbeel, and Anca Dragan, "Cooperative Inverse Reinforcement Learning", 2016.
- Paul Christiano et al., "Deep Reinforcement Learning from Human Preferences", 2017.
- Peter Eckersley, "Impossibility and Uncertainty Theorems in AI Value Alignment", 2019.
- Jacob Andreas, "Language Models as Agent Models", 2022.
- Rafael Rafailov et al., "Direct Preference Optimization: Your Language Model is Secretly a Reward Model", 2023.
- Jiaming Ji et al., "Language Models Resist Alignment: Evidence From Data Compression", 2024.
