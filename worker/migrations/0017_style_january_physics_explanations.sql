UPDATE questions
SET explanation_text = '### Key quantities

- **Period:** $T = 60/30 = 2\,\mathrm{s}$
- **Frequency:** $f = 1/T = 0.5\,\mathrm{Hz}$
- **Amplitude:** the extreme positions are $6\,\mathrm{cm}$ apart, so $A_0 = 3\,\mathrm{cm}$

### Check the statements

A full oscillation covers four amplitudes. The total distance is therefore $4A_0 = 12\,\mathrm{cm}$.

- In $3\,\mathrm{s} = 1.5T$, the ball travels $6A_0 = 18\,\mathrm{cm}$, not $24\,\mathrm{cm}$.
- The period in option C is correct, but its amplitude is not.
- Option D gives an incorrect frequency.

**Therefore, option B is correct.**',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'd91b3c77-9cbf-4bd2-b3de-8bf19283a7d6'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 18;

UPDATE questions
SET explanation_text = '### Read the wave graph

- **Wavelength:** adjacent crests are $8\,\mathrm{m}$ apart, so $\lambda = 8\,\mathrm{m}$.
- **Period:** $T = \lambda/v = 8/10 = 0.8\,\mathrm{s}$.
- **Amplitude:** $A = 6\,\mathrm{cm}$.

### Follow particle $P$

The interval $0.6\,\mathrm{s}$ equals $3T/4$. Starting from a crest, particle $P$ moves through three amplitude-lengths: crest to equilibrium, equilibrium to trough, then trough to equilibrium. Its path is $3A = 18\,\mathrm{cm}$.

- At $0.6\,\mathrm{s}$, $P$ is at equilibrium, so its displacement is zero.
- At $1.2\,\mathrm{s} = 1.5T$, $Q$ is at equilibrium and has zero acceleration.
- At $1.4\,\mathrm{s} = 1.75T$, $M$ is at a trough and has zero instantaneous velocity.

**Therefore, option A is correct.**',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = '6258ab87-32f3-41e8-9ee0-dbb49125d4cc'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 22;

UPDATE questions
SET explanation_text = '### Tangent rule

At any point on a curved path, the **instantaneous velocity** points along the tangent to the path and in the direction of motion.

Comparing the four arrows with the local tangent of the falling leaf''s trajectory, only arrow $d$ has both the correct tangent direction and forward orientation.

**Therefore, option D is correct.**',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'd9cc3c2d-311c-43d6-bbf7-62f12b41f92b'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 36;

UPDATE questions
SET explanation_text = '### Use conservation of mechanical energy

With air resistance neglected, **gravity is the only force doing work**, so the basketball''s total mechanical energy stays constant.

At release:

- **Kinetic energy:** $E_k = \dfrac{1}{2}mv^2$
- **Gravitational potential energy:** $E_p = mgh$

Thus,

$$E = E_k + E_p = \dfrac{1}{2}mv^2 + mgh.$$

The ball has this same total mechanical energy when it enters the basket.

**Therefore, option C is correct.**',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = '4e3bc811-dc38-4359-990d-e26be05d10a3'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 37;

UPDATE questions
SET explanation_text = '### Magnetic flux

The flux is $\Phi = BS$. The magnetic field is constant and perpendicular to the rail plane. Moving rod $ef$ to the left increases the area enclosed by loop $ebcf$, so the **magnetic flux increases**.

### Where current flows

An induced current needs both a changing magnetic flux and a **closed conducting path**.

- Segment $ae$ is outside the closed loop.
- Segment $bc$ is part of loop $ebcf$, so induced current flows through it.

**Therefore, option D is correct.**',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = '35cc2e3c-eb97-4b9c-a12c-6e3b86c317f8'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 42;

UPDATE questions
SET explanation_text = '### Initial force $F_1$

Let $AB = BC = l$ and take the test charge $q$ as positive.

- The force from $+Q$ at $A$ points right: $\dfrac{kQq}{(2l)^2} = \dfrac{kQq}{4l^2}$.
- The force from $-5Q$ at $B$ points left: $\dfrac{5kQq}{l^2}$.

The forces oppose each other, so

$$F_1 = \dfrac{5kQq}{l^2} - \dfrac{kQq}{4l^2} = \dfrac{19kQq}{4l^2}.$$

### Force after contact $F_2$

The identical balls share their total charge $-4Q$ equally, leaving **$-2Q$ on each ball**. Both forces on $q$ now point left and add:

$$F_2 = \dfrac{2kQq}{4l^2} + \dfrac{2kQq}{l^2} = \dfrac{5kQq}{2l^2}.$$

Therefore,

$$\dfrac{F_1}{F_2} = \dfrac{19/4}{5/2} = \dfrac{19}{10}.$$

**Therefore, option C is correct.**',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = '86893b3a-c53e-4028-b7a6-d421eca30f01'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 43;
