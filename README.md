# Residual Risk Calculation — Thought Process

The initial risk is calculated using likelihood and impact.

For example:

- Likelihood = 4
- Impact = 5

**Inherent Risk** = 4 × 5 = 20

So the initial risk is 20, which falls under the Critical severity band.

Now suppose we have some mitigations:

| Mitigation          | Effectiveness |
| ------------------- | ------------- |
| MFA                 | 4             |
| Data Encryption     | 5             |
| Security Training   | 2             |

There can be different ways to think about how these mitigations reduce the inherent risk. The approaches considered below are summarized next.

## Approach 1: Use the Strongest Mitigation

The first approach considered was to use only the strongest mitigation.

For example:

- MFA = 4
- Data Encryption = 5
- Security Training = 2

The strongest mitigation has an effectiveness of **5**.

Map effectiveness to a reduction percentage:

| Effectiveness | Reduction |
| ------------- | --------- |
| 1             | 10%       |
| 2             | 20%       |
| 3             | 30%       |
| 4             | 40%       |
| 5             | 50%       |

If the inherent risk is 20 and the strongest mitigation has effectiveness 5:

```
Reduction = 50%

Residual = 20 × (1 - 0.50)
         = 10
```

So:

- Inherent Risk = 20 → Critical
- Residual Risk = 10 → Medium

**Pros:** Simple; the impact of a strong mitigation is easy to understand.

**Trade-off:** Weaker mitigations don't directly affect the final score.

## Approach 3: Add the Reduction From Every Mitigation

Another approach was to let every mitigation contribute some percentage of reduction.

| Effectiveness | Reduction |
| ------------- | --------- |
| 1             | 5%        |
| 2             | 10%       |
| 3             | 15%       |
| 4             | 20%       |
| 5             | 25%       |

With the same mitigations:

- MFA → 20%
- Data Encryption → 25%
- Security Training → 10%

Total reduction = 55%

For an inherent risk of 20:

```
Residual = 20 × (1 - 0.55)
         = 9
```

So:

- Inherent Risk = 20 → Critical
- Residual Risk = 9 → Medium

**Pros:** Every mitigation has an effect on the final risk.

**Trade-off:** With many mitigations, reductions can stack quickly and risk falls too fast. A maximum reduction cap would be needed.

## Approach 5: Reduce Both Likelihood and Impact

Another approach was to model how a mitigation affects likelihood and impact separately.

Before mitigation:

- Likelihood = 4
- Impact = 5
- Inherent Risk = 4 × 5 = 20

After applying controls:

- Likelihood = 2
- Impact = 4
- Residual Risk = 2 × 4 = 8

This can represent risk more naturally because different mitigations affect different parts of a risk. For example:

| Mitigation        | Typical effect        |
| ----------------- | --------------------- |
| Firewall          | May reduce likelihood |
| MFA               | May reduce likelihood |
| Backups           | May reduce impact     |
| Disaster Recovery | May reduce impact     |

Instead of saying every mitigation simply reduces the overall score, each control is tied to the part of risk it actually changes.

**Trade-off:** Needs more detail per mitigation — whether it affects likelihood, impact, or both, and by how much.

## Approach 6: Weighted Mitigation Effectiveness

Another possibility was to give mitigations different importance (weights).

| Mitigation | Effectiveness | Weight |
| ---------- | ------------- | ------ |
| MFA        | 5             | 40%    |
| Encryption | 4             | 35%    |
| Training   | 2             | 25%    |

Weighted effectiveness:

```
5 × 40% = 2.0
4 × 35% = 1.4
2 × 25% = 0.5

Total = 3.9 / 5
```

Not every mitigation has the same importance. A critical control can influence residual risk more than a weaker one.

**Trade-off:** Adds another factor (weight) that must be decided and maintained. More flexible, but more complex.

## Final Approach

After considering these options, the chosen model is **Approach 1: strongest mitigation**.

Main reason: keep the calculation simple and predictable.

Example:

- MFA = 4
- Data Encryption = 5
- Security Training = 2

Strongest mitigation = **5** → **50%** reduction

```
Inherent Risk = 20

Residual Risk = 20 × (1 - 0.50)
              = 10
```

Final result:

- Inherent Risk = 20 → Critical
- Residual Risk = 10 → Medium

Residual risk is also floored so it can never fall below 1:

```
Residual Risk = max(1, calculatedResidual)
```

### Trade-off

Only the strongest mitigation directly affects the score. Weaker mitigations do not separately contribute to the calculation.

That trade-off is acceptable in favor of a simple, predictable scoring model. If multiple mitigations later need a measurable combined effect, additive reduction or weighted effectiveness can be revisited.
