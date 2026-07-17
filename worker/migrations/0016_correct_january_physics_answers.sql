UPDATE questions
SET text = 'As shown in the figure, a spring oscillator performs simple harmonic motion between $A$ and $B$, with $O$ as the equilibrium position. The distance between $A$ and $B$ is $6\,\mathrm{cm}$, and the ball completes 30 full oscillations in 60 seconds. Thus,',
    correct_index = 1,
    explanation_text = 'First calculate the main quantities of the simple harmonic motion. From 30 oscillations in 60 seconds, the period is $T = 60/30 = 2\,\mathrm{s}$ and the frequency is $f = 1/T = 0.5\,\mathrm{Hz}$. Since $A$ and $B$ are the two extreme positions, the amplitude is half their separation: $A_0 = 6/2 = 3\,\mathrm{cm}$.

In one complete oscillation the ball travels four amplitudes, so the distance is $4A_0 = 12\,\mathrm{cm}$; therefore option B is correct. For comparison, 3 seconds is $1.5T$, giving a path of $4A_0 + 2A_0 = 18\,\mathrm{cm}$ rather than $24\,\mathrm{cm}$. The period in option C is right but its amplitude is not, and option D gives the wrong frequency.',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'd91b3c77-9cbf-4bd2-b3de-8bf19283a7d6'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 18;

UPDATE questions
SET answers_json = '["Within $0\\sim 0.6\\,\\mathrm{s}$, the distance traveled by particle $P$ is $18\\,\\mathrm{cm}$","At $t = 0.6\\,\\mathrm{s}$, the displacement of particle $P$ from equilibrium is $6\\,\\mathrm{cm}$","At $t = 1.2\\,\\mathrm{s}$, the acceleration of particle $Q$ is maximum","At $t = 1.4\\,\\mathrm{s}$, particle $M$ moves in the negative $y$ direction"]',
    correct_index = 0,
    explanation_text = 'From the graph, adjacent crests are $8\,\mathrm{m}$ apart, so $\lambda = 8\,\mathrm{m}$. With wave speed $v = 10\,\mathrm{m/s}$, the period is $T = \lambda/v = 0.8\,\mathrm{s}$, and the amplitude is $A = 6\,\mathrm{cm}$.

During $0.6\,\mathrm{s} = 3T/4$, particle $P$ starts at a crest and travels three amplitude-lengths: crest to equilibrium, equilibrium to trough, and trough to equilibrium. Its total path is therefore $3A = 18\,\mathrm{cm}$, making option A correct. At that instant its displacement is zero, so B is false. After $1.2\,\mathrm{s} = 1.5T$, $Q$ is at equilibrium and its acceleration is zero, so C is false. After $1.4\,\mathrm{s} = 1.75T$, $M$ is at a trough with zero instantaneous velocity, so D is also false.',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = '6258ab87-32f3-41e8-9ee0-dbb49125d4cc'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 22;

UPDATE questions
SET answers_json = '["$a$","$b$","$c$","$d$"]',
    correct_index = 3,
    explanation_text = 'For motion along a curved path, the instantaneous velocity always points along the tangent to the trajectory at the object''s current position and in the direction of motion. Comparing the four arrows with the local tangent of the falling leaf''s path, only the arrow marked $d$ follows the tangent in the forward direction. Therefore option D is correct.',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'd9cc3c2d-311c-43d6-bbf7-62f12b41f92b'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 36;

UPDATE questions
SET answers_json = '["$\\dfrac{1}{2}mv^2 + mgH$","$\\dfrac{1}{2}mv^2 + mg(H-h)$","$\\dfrac{1}{2}mv^2 + mgh$","$\\dfrac{1}{2}mv^2 + mgH + mg(H-h)$"]',
    correct_index = 2,
    explanation_text = 'With air resistance neglected, gravity is the only force doing work, so the basketball''s mechanical energy remains constant. At release, its kinetic energy is $\dfrac{1}{2}mv^2$ and its gravitational potential energy relative to the ground is $mgh$. Hence the total mechanical energy is $E = \dfrac{1}{2}mv^2 + mgh$, and it has this same value when the ball enters the basket. Thus option C is correct.',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = '4e3bc811-dc38-4359-990d-e26be05d10a3'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 37;

UPDATE questions
SET answers_json = '["The magnetic flux through loop $ebcf$ remains unchanged","The magnetic flux through loop $ebcf$ decreases","There is a current through segment $ae$","There is a current through segment $bc$"]',
    correct_index = 3,
    explanation_text = 'The magnetic flux is $\Phi = BS$. The magnetic field is constant and perpendicular to the rail plane, while moving rod $ef$ to the left increases the area enclosed by loop $ebcf$; consequently the flux through that loop increases. An induced current requires both a changing magnetic flux and a closed conducting path. Segment $ae$ lies outside the closed loop, but segment $bc$ belongs to it, so induced current flows through $bc$. Therefore option D is correct.',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = '35cc2e3c-eb97-4b9c-a12c-6e3b86c317f8'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 42;

UPDATE questions
SET answers_json = '["$\\dfrac{21}{10}$","$\\dfrac{21}{16}$","$\\dfrac{19}{10}$","$\\dfrac{19}{16}$"]',
    correct_index = 2,
    explanation_text = 'Let $AB = BC = l$ and take the test charge $q$ as positive. Initially, the force from $+Q$ at $A$ points right and has magnitude $kQq/(2l)^2 = kQq/(4l^2)$, while the force from $-5Q$ at $B$ points left and has magnitude $5kQq/l^2$. The forces oppose each other, so $F_1 = 5kQq/l^2 - kQq/(4l^2) = 19kQq/(4l^2)$.

After the identical balls touch, their total charge $-4Q$ divides equally, leaving $-2Q$ on each ball. Both forces then point left and add: $F_2 = 2kQq/(4l^2) + 2kQq/l^2 = 5kQq/(2l^2)$. Therefore $F_1/F_2 = (19/4)/(5/2) = 19/10$, which is option C.',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = '86893b3a-c53e-4028-b7a6-d421eca30f01'
  AND exam_id = 'physics-january-exam-1784206087180'
  AND position = 43;

UPDATE exam_sessions
SET score_earned = (
      SELECT ROUND(COALESCE(SUM(
        CASE
          WHEN CAST(json_extract(exam_sessions.answers_json, '$."' || q.id || '"') AS INTEGER) = q.correct_index
          THEN q.marks
          ELSE 0
        END
      ), 0), 2)
      FROM questions q
      WHERE q.exam_id = exam_sessions.exam_id
    ),
    score_total = (
      SELECT ROUND(COALESCE(SUM(q.marks), 0), 2)
      FROM questions q
      WHERE q.exam_id = exam_sessions.exam_id
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE exam_id = 'physics-january-exam-1784206087180'
  AND submitted_at IS NOT NULL;
