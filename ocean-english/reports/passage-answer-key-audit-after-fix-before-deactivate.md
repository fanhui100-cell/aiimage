# Passage Answer Key Audit

Generated: 2026-06-17T21:27:46.572Z

Scope: active `banked_cloze` and `seven_select` rows. This report is read-only; no database rows were changed.

## Summary

| Type | Rows | Shape issue rows | Confirmed wrong rows | Confirmed wrong blanks | Ambiguous rows | AI error rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| banked_cloze | 314 | 0 | 70 | 115 | 99 | 0 |
| seven_select | 535 | 0 | 262 | 436 | 274 | 0 |

## Confirmed Wrong

### banked_cloze-bp-cet4-14qnu4n
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that major life changes require dramatic efforts, but research suggests that small, consistent habits can be (1) powerful. In fact, tiny adjustments in daily ro
- Blank 9: current `12:transform` -> suggested `9:expand`; confidence 0.85; 'transform into' is transitive and requires an object; 'expand into' is intransitive and fits the context of small steps leading to growth.

### banked_cloze-bp-cet4-15h4r3n
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that achieving success requires a major (1) or a single breakthrough moment. However, research in psychology suggests that it is actually the accumulation of sm
- Blank 9: current `2:reduce` -> suggested `3:difficulty`; confidence 0.95; The phrase 'increase the difficulty' is grammatically correct and contextually appropriate, while 'reduce' is a verb that does not fit as a noun object.

### banked_cloze-bp-cet4-1a9b6kk
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with endless (1) from smartphones and social media, the idea of being bored seems almost unbearable. Yet boredom is not a (2) to be avoided at all costs; it can a
- Blank 9: current `5:drift` -> suggested `13:wander`; confidence 0.9; 'wander' is the standard collocation for thoughts moving freely; 'drift' is less idiomatic and typically intransitive in this context

### banked_cloze-bp-cet4-1atu1lp
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people consider boredom a negative state to be avoided at all costs. However, recent studies suggest that being bored can actually (1) creativity and problem-solving skills. W
- Blank 6: current `0:limited` -> suggested `2:extinct`; confidence 0.85; boredom almost extinct fits the context of technology eliminating boredom; 'limited' is too weak and not idiomatic here

### banked_cloze-bp-cet4-1c767x
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In an age of constant stimulation, boredom has become a rare and often (1) experience. Many people, especially the young, feel an urgent need to fill every spare moment with digita
- Blank 1: current `2:ignored` -> suggested `12:avoided`; confidence 0.9; 'ignored experience' is ungrammatical; 'avoided experience' fits the context of rarity and negative connotation.

### banked_cloze-bp-cet4-1cfg1to
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people struggle to make significant changes in their lives, often because they aim too high and feel (1) by the scale of the challenge. However, a growing body of research sug
- Blank 1: current `11:consistent` -> suggested `10:overwhelmed`; confidence 0.95; 'feel overwhelmed by' is correct passive structure; 'consistent' is an adjective that does not fit.
- Blank 2: current `14:persistence` -> suggested `13:yield`; confidence 0.95; 'can yield' is verb phrase; 'persistence' is a noun and ungrammatical after modal.
- Blank 5: current `12:remarkable` -> suggested `11:consistent`; confidence 0.9; 'consistent and patient' is natural collocation; 'remarkable' does not fit the advice context.
- Blank 8: current `7:commit` -> suggested `14:persistence`; confidence 0.95; 'build persistence' is noun object; 'commit' is a verb and ungrammatical here.
- Blank 9: current `13:yield` -> suggested `12:remarkable`; confidence 0.95; 'can be remarkable' requires adjective; 'yield' is a verb.
- Blank 10: current `8:resistance` -> suggested `7:commit`; confidence 0.9; 'commit it to your routine' is correct verb phrase; 'resistance' is a noun and ungrammatical.

### banked_cloze-bp-cet4-1e6faps
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world that never stops talking, silence has become a (1) commodity. We are constantly surrounded by noise — from traffic, notifications, and endless conversations. Yet, it is 
- Blank 10: current `11:distraction` -> suggested `10:possibilities`; confidence 0.95; The passage ends with a positive contrast: silence is not absence but presence of something. 'Distraction' contradicts the uplifting tone, while 'possibilities' aligns with creative potential and insight.

### banked_cloze-bp-cet4-1h9to6u
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world where entertainment is always at our fingertips, boredom has become a rare (1) . Yet, some researchers argue that being bored can actually be (2) for creativity. When th
- Blank 7: current `12:resist` -> suggested `9:ignore`; confidence 0.9; 'resist any moment of stillness' is unnatural; 'ignore' better conveys avoiding stillness by reaching for phones.

### banked_cloze-bp-cet4-1i7nygy
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, silence has become a rare (1). Many people feel uneasy when there is no sound around them. They reach for their phones or turn on the TV to f
- Blank 2: current `2:empty` -> suggested `9:silence`; confidence 0.95; 'fill the empty' is ungrammatical; 'fill the silence' is the correct collocation.

### banked_cloze-bp-cet4-1k5467x
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the value of silence is often (1) . We are surrounded by notifications, traffic, and endless conversations, leaving little room for quiet ref
- Blank 7: current `4:uncomfortable` -> suggested `14:significant`; confidence 1; 'uncomfortable improvements' is semantically impossible; 'significant improvements' is correct.
- Blank 8: current `1:ignore` -> suggested `4:uncomfortable`; confidence 1; 'feels' requires an adjective; 'ignore' is a verb. 'Uncomfortable' fits the context.
- Blank 9: current `9:overwhelmed` -> suggested `6:tolerate`; confidence 0.9; 'learn to' needs a base verb; 'overwhelmed' is a past participle. 'Tolerate' is the best available option.
- Blank 10: current `5:reduced` -> suggested `9:overwhelmed`; confidence 1; 'feel reduced by noise' is unidiomatic; 'feel overwhelmed by noise' is correct.

### banked_cloze-bp-cet4-1m809lv
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In an age of constant digital (1), it seems almost impossible to experience true boredom. However, research suggests that allowing our minds to wander can actually (2) creativity. 
- Blank 1: current `10:stimulation` -> suggested `3:distraction`; confidence 0.9; 'Constant digital distraction' is idiomatic and fits the contrast with boredom; 'stimulation' is too positive and less natural here.

### banked_cloze-bp-cet4-1nwl4ir
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Modern life is filled with conveniences that save time and effort. However, these conveniences often come with a hidden (1) that we fail to notice. Take single-use plastic items, f
- Blank 7: current `3:difference` -> suggested `7:urgent`; confidence 0.95; 'take difference action' is ungrammatical; 'take urgent action' is the correct collocation.
- Blank 8: current `1:scale` -> suggested `3:difference`; confidence 0.95; 'make a scale' is not idiomatic; 'make a difference' is the standard phrase.
- Blank 9: current `4:essential` -> suggested `1:scale`; confidence 0.95; 'at a larger essential' is ungrammatical; 'at a larger scale' is the correct collocation.
- Blank 10: current `2:benefit` -> suggested `4:essential`; confidence 0.95; 'it is benefit' is ungrammatical (noun used as adjective); 'it is essential' fits meaning and grammar.

### banked_cloze-bp-cet4-1secwj6
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the ability to sit in silence has become a rare (1). Many people feel (2) when there is no sound, as if silence is something to be (3). Howev
- Blank 9: current `9:embrace` -> suggested `10:improve`; confidence 0.9; 'embrace your mood' is not idiomatic; context needs a verb meaning to make better
- Blank 10: current `13:reduce` -> suggested `9:embrace`; confidence 0.95; 'reduce a few moments of silence' is semantically odd; 'embrace' fits the intended meaning

### banked_cloze-bp-cet4-1u2ckm8
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, the value of silence is often (1) . People rush from one activity to another, rarely taking a moment to simply be still. However, silence can
- Blank 3: current `1:distract` -> suggested `13:gather`; confidence 0.9; 'Distract ourselves from' contradicts the intended meaning of withdrawing to rest; 'gather ourselves' fits the context of composing oneself.

### banked_cloze-bp-cet4-1v5yf75
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Procrastination is often seen as a bad habit that leads to stress and poor performance. However, recent studies suggest that it can actually (1) creativity and problem-solving skil
- Blank 5: current `10:beneficial` -> suggested `0:negative`; confidence 0.95; The sentence 'not all procrastination is ___' sets up a contrast between active and passive procrastination; 'beneficial' contradicts the logical flow, while 'negative' correctly introduces the distinction.
- Blank 10: current `3:positive` -> suggested `10:beneficial`; confidence 0.9; 'a ___ tool' requires an adjective like 'beneficial' to match the positive outcome; 'positive' is less idiomatic and 'beneficial' is clearly better in this context.

### banked_cloze-bp-cet4-1w80xl3
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In a world filled with constant noise, silence has become a (1) commodity. Many people feel (2) when they are left alone without any sound. However, research shows that moments of 
- Blank 4: current `6:relax` -> suggested `14:process`; confidence 0.95; 'Relax' does not fit the structure 'to ___ and process information'; 'process' is the only logical verb that pairs with 'process' in this context.

### banked_cloze-bp-cet4-56ce3o
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that achieving big goals requires dramatic changes, but research suggests that small, consistent habits can be (1) more powerful over time. For example, reading
- Blank 4: current `5:essential` -> suggested `4:significant`; confidence 0.9; 'tiny but significant' is a standard contrast for atomic analogy; 'essential' does not convey the idea of small yet impactful.

### banked_cloze-bp-cet4-5kd4aa
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In today’s hyper-connected world, many people find themselves constantly glued to their screens. This (1) behavior can lead to mental fatigue and a sense of isolation. To counter t
- Blank 2: current `7:deliberately` -> suggested `-1:`; confidence 0.95; The blank requires a verb, but 'deliberately' is an adverb; no suitable verb in the bank fits the intended meaning 'refrain from using'.
- Blank 5: current `4:initiating` -> suggested `-1:`; confidence 0.9; 'Initiating' is a gerund/participle and does not fit the structure 'However, (5) such a break is not always easy'; no option in the bank provides a correct form.

### banked_cloze-bp-cet4-6d6zmz
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that success requires a single, dramatic (1) . However, research in psychology suggests that it is actually small, consistent habits that (2) our lives over tim
- Blank 6: current `14:ignores` -> suggested `5:challenges`; confidence 0.9; 'ignores' means disregards, but the context requires a verb meaning 'opposes' or 'questions'; 'challenges' fits better.

### banked_cloze-bp-cet4-6wnmqm
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In modern cities, public transportation plays a vital role in reducing traffic congestion and air pollution. However, its (1) still faces many challenges, especially in developing 
- Blank 2: current `5:sufficient` -> suggested `1:shortage`; confidence 0.9; 'lack of sufficient funds' is grammatically possible but semantically odd; 'lack of shortage' is redundant. The intended meaning is 'lack of funds', so 'shortage' is correct.
- Blank 4: current `1:shortage` -> suggested `3:reduction`; confidence 0.85; 'Shortage of service quality' is not idiomatic; 'reduction of service quality' fits the context of declining quality.

### banked_cloze-bp-cet4-97omvw
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that success requires dramatic changes, but research suggests that small, consistent habits can be surprisingly (1). These tiny actions, often too small to seem
- Blank 2: current `0:ignore` -> suggested `13:significant`; confidence 0.95; 'seem ignore' is ungrammatical; 'ignore' is a verb, but an adjective is required after 'seem'. 'significant' fits both grammar and meaning.

### banked_cloze-bp-cet4-aclnqz
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that achieving big goals requires dramatic changes, but research suggests that small, consistent habits can be more (1). Instead of trying to transform your lif
- Blank 2: current `5:grow` -> suggested `4:accumulate`; confidence 0.9; 'Grow' is intransitive and does not naturally collocate with 'into significant results'; 'accumulate' correctly conveys the idea of small actions building up.
- Blank 9: current `2:accumulation` -> suggested `13:constant`; confidence 0.95; 'Accumulation' is a noun, but the blank requires an adjective to modify 'system'; 'constant' fits the context of a steady, ongoing system.

### banked_cloze-bp-cet4-auhu6j
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: The ocean’s twilight zone, lying between 200 and 1,000 meters below the surface, is a world of near darkness. Despite its (1) from sunlight, this layer teems with life. Scientists 
- Blank 3: current `12:adaptation` -> suggested `2:presence`; confidence 0.9; 'Adaptation' is a process, but the sentence refers to bioluminescence as a feature or attribute that helps creatures; 'presence' fits the context of having this ability.

### banked_cloze-bp-cet4-bsuqq6
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In an age of constant digital noise, the simple act of reading silently has become a (1) practice for many people. Unlike listening to audiobooks or watching videos, silent reading
- Blank 5: current `4:benefit` -> suggested `6:value`; confidence 0.95; 'benefit' is a verb but the blank requires a noun; 'value' fits as a noun meaning importance

### banked_cloze-bp-cet4-ccfk8q
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people struggle to make lasting changes in their lives, often because they aim too high and give up quickly. However, a growing body of research suggests that the secret to lo
- Blank 10: current `0:ridiculous` -> suggested `6:obvious`; confidence 0.9; 'ridiculous' has a negative connotation that does not match the intended meaning of trivial/easy; 'obvious' fits the context of a habit so small it is hardly noticeable.

### banked_cloze-bp-cet4-j80iyv
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people believe that achieving great success requires dramatic changes, but in reality, small habits can (1) our lives in remarkable ways. A simple daily routine, such as readi
- Blank 9: current `13:persistent` -> suggested `3:momentum`; confidence 0.9; The blank requires a noun; 'persistent' is an adjective. 'Momentum' fits 'steady momentum of small wins' idiomatically.
- Blank 10: current `6:commit` -> suggested `10:integrate`; confidence 0.95; 'Commit it into your daily life' is ungrammatical; 'integrate it into your daily life' is the correct collocation.

### banked_cloze-bp-cet4-jbpnyp
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In today's world, the rapid development of technology has brought about significant changes to our daily lives. One of the most noticeable (1) is the way we communicate. People now
- Blank 1: current `2:reduction` -> suggested `7:aspect`; confidence 0.95; 'reduction' does not fit the context of 'one of the most noticeable...' referring to a feature or area of change; 'aspect' is the correct noun.

### banked_cloze-bp-cet4-kxwg7x
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Many people underestimate the value of small talk, viewing it as a (1) waste of time. However, research shows that brief conversations with strangers can significantly (2) our mood
- Blank 1: current `0:suffer` -> suggested `14:mere`; confidence 0.95; 'suffer' is a verb, but the blank requires an adjective to modify 'waste of time'; 'mere' fits the collocation 'a mere waste of time'.
- Blank 5: current `1:benefit` -> suggested `0:suffer`; confidence 0.9; The context says introverts fear awkwardness, so they are negatively affected; 'suffer from' is the correct collocation, not 'benefit from'.

### banked_cloze-bp-cet4-lxi6sl
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In an age of constant digital stimulation, the feeling of boredom has become something we try to (1) at all costs. Yet recent studies suggest that boredom is not merely a negative 
- Blank 2: current `5:embraced` -> suggested `8:eliminated`; confidence 0.95; The context requires a verb meaning 'gotten rid of', not 'embraced'.
- Blank 10: current `12:resilience` -> suggested `14:regulation`; confidence 0.85; The phrase 'emotional regulation' is a standard term; 'resilience' is the outcome, not the skill being improved.

### banked_cloze-bp-cet4-n9pfc8
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: Habits are an essential part of our daily lives. They can either help us achieve our goals or (1) our progress. According to psychologists, habits are formed through a three-step l
- Blank 6: current `8:underestimate` -> suggested `1:confuse`; confidence 0.85; 'Underestimate' cannot take a 'that' clause; 'confuse' is the only option that can, though not ideal, it is less wrong.

### banked_cloze-bp-cet4-qfelda
- Type: banked_cloze; exam: CET-4; level: lv3
- Passage: In recent years, telemedicine has (1) from a niche service to a mainstream healthcare option. Patients can now consult doctors via video calls, which not only saves time but also (
- Blank 3: current `2:promotion` -> suggested `13:adoption`; confidence 0.9; 'promotion' implies active marketing, but the context is about the uptake/implementation facing obstacles; 'adoption' fits the meaning of acceptance and use.
- Blank 5: current `10:replace` -> suggested `7:concern`; confidence 1; 'replace' is ungrammatical and semantically wrong; the sentence requires a noun like 'concern' to refer to an issue about personal interaction.

### banked_cloze-bp-cet6-12na6oi
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In recent years, the concept of digital minimalism has gained considerable traction, urging people to reduce their screen time and (1) with technology in a more intentional way. Ho
- Blank 10: current `7:reinforce` -> suggested `10:widen`; confidence 0.9; Context requires a verb meaning 'increase' or 'exacerbate' divides; 'reinforce' is less precise and contradicts the contrast 'rather than bridge them'.

### banked_cloze-bp-cet6-13cptaw
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Urban green spaces are often celebrated for their aesthetic appeal, but their role in mitigating the effects of climate change is frequently (1). Recent studies have shown that par
- Blank 2: current `3:degradation` -> suggested `4:existence`; confidence 0.9; 'Existence' is under threat from urbanization and budget cuts, not 'degradation' itself.
- Blank 9: current `4:existence` -> suggested `3:degradation`; confidence 0.85; 'Irreversible degradation' is a common collocation; 'existence' would imply ceasing to exist, which is not the focus.

### banked_cloze-bp-cet6-166458o
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: As the digital world expands, the concept of identity has become increasingly (1). In the past, a simple username and password were considered (2) for online security. However, wit
- Blank 3: current `0:feasible` -> suggested `4:adequate`; confidence 0.9; 'Feasible' means possible, not sufficient; 'no longer adequate' is the correct collocation for security sufficiency.

### banked_cloze-bp-cet6-18n1jjt
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age of constant connectivity, a growing number of people are embracing digital minimalism — a philosophy that advocates reducing screen time to enhance well-being. However, t
- Blank 2: current `8:compelling` -> suggested `7:resist`; confidence 0.9; 'Compelling' means convincing, not difficult; the structure requires an adjective meaning hard, but no such adjective exists; 'resist' as a verb is the only plausible fit in context.
- Blank 10: current `3:hazards` -> suggested `1:abundance`; confidence 0.85; Context of tech companies adding mindful features implies acknowledging excess (abundance) of engagement, not hazards; 'hazards' is too strong and less coherent.

### banked_cloze-bp-cet6-1965w8g
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices have become an (1) part of daily life, the concept of a 'digital detox' has gained remarkable popularity. Many people, feeling overwhelmed by consta
- Blank 10: current `1:conscious` -> suggested `2:balanced`; confidence 0.9; 'conscious relationship' is not idiomatic; 'balanced relationship' is the standard collocation and fits the context of moderation.

### banked_cloze-bp-cet6-1btp2m4
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Procrastination, often (1) as a sign of laziness, is actually a complex psychological phenomenon. Recent studies suggest that it is not about poor time management but rather an emo
- Blank 2: current `4:cope` -> suggested `5:regulation`; confidence 0.95; 'cope' is a verb, but the blank requires a noun (an emotional ___ mechanism). 'regulation' fits as a noun meaning a coping or managing mechanism.

### banked_cloze-bp-cet6-1d3ne67
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid advancement of artificial intelligence has (1) a profound impact on various industries, from healthcare to finance. However, the (2) of this technology also raises ethica
- Blank 1: current `6:impact` -> suggested `11:had`; confidence 0.95; Present perfect requires past participle; 'impact' is a noun, not a verb form.

### banked_cloze-bp-cet6-1f2pl85
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In our fast-paced world, convenience has become a (1) commodity. We rely on single-use plastics, fast food, and instant deliveries without fully (2) their long-term consequences. A
- Blank 10: current `12:sustained` -> suggested `1:ignored`; confidence 0.9; 'sustained awareness' is ungrammatical in context; 'ignored awareness' correctly conveys the needed meaning of lack of awareness.

### banked_cloze-bp-cet6-1jzx21x
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In today’s fast-paced world, the desire for convenience often (1) our daily decisions. We choose ready-made meals over home cooking, and digital communication over face-to-face int
- Blank 2: current `14:acknowledge` -> suggested `11:overlook`; confidence 0.9; The phrase 'seldom overlook' fits the meaning of failing to notice the hidden cost, while 'seldom acknowledge' contradicts the intended sense of neglect.
- Blank 7: current `3:engaging` -> suggested `13:adopt`; confidence 0.8; After 'recommend', a gerund or noun phrase is needed; 'engaging' as a gerund is possible but 'adopt' is a base verb and does not fit the structure. 'Adopting' would be correct, but 'adopt' is not. However, the list has no gerund form; 'adopt' is the only verb that could work if rephrased, but the current key 'engaging' is ungrammatical as an adjective here. The suggested 'adopt' is also ungrammatical. The best fit is 'engaging' as a gerund (recommend engaging in), which is acceptable. Thus this is a false alarm.

### banked_cloze-bp-cet6-1nv5sy0
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In recent years, the concept of digital minimalism has gained considerable (1) among tech-savvy individuals. Advocates argue that by deliberately reducing screen time, people can a
- Blank 3: current `1:fragmented` -> suggested `11:isolating`; confidence 0.9; 'fragmented effect' is unidiomatic; 'isolating effect' fits the context of social relationships and loneliness
- Blank 5: current `11:isolating` -> suggested `1:fragmented`; confidence 0.8; 'isolating nature' is possible but 'fragmented nature' better describes brief, disjointed modern communication

### banked_cloze-bp-cet6-1qgdu3n
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Urban greenery is often celebrated for its aesthetic appeal and environmental benefits. However, city planners must also (1) the potential drawbacks that accompany large-scale tree
- Blank 2: current `14:release` -> suggested `1:density`; confidence 0.9; 'release of pollen' is unidiomatic; 'density of pollen' fits the context of a major issue
- Blank 8: current `12:evaluating` -> suggested `0:assess`; confidence 0.95; After 'carefully', the base form 'assess' is required for parallel structure with 'diversifying' and 'using'

### banked_cloze-bp-cet6-1sa02t9
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid advancement of artificial intelligence has (1) a profound impact on various industries, from healthcare to finance. However, this progress also raises (2) questions about
- Blank 1: current `2:generate` -> suggested `6:exerted`; confidence 0.95; 'exerted a profound impact' is the correct collocation; 'generate an impact' is not idiomatic.

### banked_cloze-bp-cet6-1sovzt1
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices have become an (1) part of daily life, the paradox of connectivity versus isolation has never been more pronounced. While social media platforms pro
- Blank 5: current `3:compelling` -> suggested `6:excessive`; confidence 0.9; 'compelling sense of anxiety' is unidiomatic; 'excessive anxiety' naturally describes the heightened anxiety from device separation.

### banked_cloze-bp-cet6-1suaofo
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The ocean, often (1) as a vast and unchanging expanse, is in fact a highly dynamic system. Its currents, driven by wind and temperature differences, (2) heat around the globe, regu
- Blank 4: current `4:decline` -> suggested `10:released`; confidence 0.9; 'decline' is intransitive and cannot take an object; 'released' fits the passive structure and meaning.

### banked_cloze-bp-cet6-1uudhgo
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age of constant connectivity, the concept of digital minimalism has gained considerable traction. Proponents argue that by (1) our exposure to screens and notifications, we c
- Blank 4: current `5:sustained` -> suggested `1:distracting`; confidence 0.9; 'sustained tasks' is not idiomatic; 'distracting tasks' contrasts with cognitive overload

### banked_cloze-bp-cet6-1v8bign
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices are virtually (1) , the idea of a digital detox has gained considerable traction. However, the concept is often (2) by a fundamental paradox: the mo
- Blank 2: current `10:haunted` -> suggested `11:paradox`; confidence 0.95; 'haunted' is ungrammatical here; 'paradox' correctly completes the passive structure 'is ... by a fundamental paradox'.

### banked_cloze-bp-cet6-1w7zzgz
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age of constant connectivity, the concept of digital minimalism has emerged as a (1) response to information overload. Proponents argue that by (2) unnecessary digital distra
- Blank 6: current `12:doubt` -> suggested `-1:`; confidence 0.8; 'doubt that' is grammatically odd and semantically weak; no suitable synonym in the bank, but the current key is clearly wrong.

### banked_cloze-bp-cet6-4fc191
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age dominated by constant chatter and digital noise, the art of silence is often overlooked. Yet, silence can be a powerful tool in communication, capable of conveying meanin
- Blank 1: current `6:yield` -> suggested `4:value`; confidence 0.8; 'yield' is semantically odd; 'value' is also weak but less unnatural; no perfect fit, but 'yield' is clearly wrong.

### banked_cloze-bp-cet6-7agls2
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where screens dominate our daily lives, the concept of a digital detox has gained considerable (1). Yet, for many, the idea of completely disconnecting from the online wo
- Blank 2: current `13:feasible` -> suggested `8:disturbing`; confidence 0.95; 'not only impractical but also feasible' is contradictory; 'disturbing' fits the negative parallel structure.
- Blank 4: current `6:boost` -> suggested `3:reduction`; confidence 0.9; Blank needs a noun; 'boost' is a verb. 'Reduction' fits as a noun meaning decrease in negative symptoms.
- Blank 8: current `5:speculate` -> suggested `4:challenge`; confidence 0.95; 'Speculate the assumption' is ungrammatical; 'challenge the assumption' is a common collocation.
- Blank 10: current `8:disturbing` -> suggested `13:feasible`; confidence 0.9; 'Disturbing alternative' is negative and contradicts the positive 'nuanced perspective'; 'feasible' means workable and fits.

### banked_cloze-bp-cet6-836h1s
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where smartphones have become an (1) part of daily life, the concept of a digital detox has gained considerable traction. Many individuals, feeling overwhelmed by constan
- Blank 4: current `13:obstacle` -> suggested `1:updates`; confidence 0.95; 'requires frequent obstacle' is ungrammatical; 'updates' fits the context of app maintenance.

### banked_cloze-bp-cet6-83l5o4
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices have become an (1) part of daily life, the concept of a “digital detox” has gained considerable traction. Many people, feeling overwhelmed by consta
- Blank 10: current `1:consciously` -> suggested `0:engage`; confidence 0.95; Blank requires a verb; 'consciously' is an adverb and cannot serve as the main verb. 'Engage' fits the context and is the only plausible verb left.

### banked_cloze-bp-cet6-c55pul
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Urban green spaces, such as parks and community gardens, have become a crucial (1) of modern city planning. They not only (2) the aesthetic appeal of a city but also provide essent
- Blank 8: current `1:reduce` -> suggested `9:intensify`; confidence 0.9; 'reduce efforts' is semantically odd in this context; 'intensify' or 'increase' is needed to convey the intended meaning of strengthening efforts.

### banked_cloze-bp-cet6-fgqi7e
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The concept of digital nomadism, which allows individuals to work remotely while traveling the world, has gained considerable (1) in recent years. This lifestyle is largely (2) by 
- Blank 1: current `13:advantages` -> suggested `12:traction`; confidence 0.95; 'gained considerable advantages' is unidiomatic; 'gained considerable traction' is the standard collocation
- Blank 3: current `10:decline` -> suggested `9:maximize`; confidence 0.98; Context requires a positive action to improve productivity and quality of life, not 'decline'
- Blank 7: current `12:traction` -> suggested `11:recognize`; confidence 0.99; 'begun to traction' is ungrammatical; need a verb like 'recognize' to fit 'begun to recognize the benefits'

### banked_cloze-bp-cet6-fyobw8
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age of constant connectivity, the concept of digital minimalism has gained considerable (1). Advocates argue that reducing screen time can (2) mental health and boost product
- Blank 5: current `13:supplemented` -> suggested `4:pronounced`; confidence 0.95; 'supplemented' is a past participle verb; the blank requires an adjective like 'pronounced' to describe the feeling of isolation.
- Blank 6: current `6:severe` -> suggested `13:supplemented`; confidence 0.95; 'severe' is an adjective; the blank requires a past participle verb like 'supplemented' to indicate combining with alternatives.
- Blank 8: current `9:underscore` -> suggested `7:cold turkey`; confidence 0.95; 'underscore' is a verb meaning emphasize; the blank needs an idiomatic phrase meaning abruptly, i.e., 'cold turkey'.
- Blank 9: current `10:overlook` -> suggested `9:underscore`; confidence 0.95; 'overlook' means fail to notice, opposite of intended meaning; 'underscore' means emphasize, fitting the context.
- Blank 10: current `14:disrupt` -> suggested `10:overlook`; confidence 0.95; 'disrupt' means interrupt; the sentence requires 'overlook' meaning fail to consider the complex role.

### banked_cloze-bp-cet6-g7kmig
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where information flows at unprecedented speed, the phenomenon of the digital echo chamber has become a growing (1) . Social media algorithms, designed to maximize user e
- Blank 3: current `0:outcome` -> suggested `10:consequence`; confidence 0.85; 'outcome' is neutral and less natural in 'dangerous outcome of perspectives'; 'consequence' fits the negative connotation and collocation better.
- Blank 4: current `7:tolerant` -> suggested `11:immune`; confidence 0.9; 'tolerant to viewpoints' is unidiomatic; correct collocation is 'immune to viewpoints' meaning resistant or unresponsive.

### banked_cloze-bp-cet6-i7kf9s
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In our modern world, convenience is often hailed as a supreme virtue. We have developed a (1) for instant gratification, from fast food to same-day delivery. However, this pursuit 
- Blank 5: current `4:scarcity` -> suggested `10:virtue`; confidence 0.9; 'scarcity of waiting' is unnatural; 'virtue of waiting' fits the contrast with 'satisfaction of earned reward' and is a common collocation.
- Blank 7: current `6:deprived` -> suggested `9:content`; confidence 0.85; 'feel less content' directly contrasts with overwhelming options and matches the meaning of satisfaction; 'deprived' is less coherent.

### banked_cloze-bp-cet6-id0vi
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where every moment can be captured and stored, we find ourselves facing a curious (1) . The very tools designed to preserve our memories may actually be (2) our ability t
- Blank 6: current `13:fabric` -> suggested `3:completion`; confidence 0.9; 'sense of fabric' is unidiomatic; 'sense of completion' correctly conveys the feeling that the memory task is done.

### banked_cloze-bp-cet6-ieu49r
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid development of artificial intelligence has (1) a profound impact on various industries. Many experts believe that the (2) of human labor by machines is inevitable, yet th
- Blank 4: current `2:creativity` -> suggested `7:limited`; confidence 1; 'Creativity' is a noun, but blank requires an adjective after 'is still'; 'limited' fits grammatically and semantically.
- Blank 5: current `9:challenged` -> suggested `2:creativity`; confidence 1; 'Challenged' is a verb, but blank needs a noun as object of 'lacks the'; 'creativity' fits perfectly.
- Blank 6: current `0:prevalence` -> suggested `9:challenged`; confidence 1; 'Prevalence' is a noun, but present perfect requires a past participle; 'challenged' fits grammatically and semantically.
- Blank 7: current `3:formulate` -> suggested `0:prevalence`; confidence 1; 'Formulate' is a verb, but blank needs a noun as subject; 'prevalence' fits grammatically and semantically.
- Blank 8: current `12:concern` -> suggested `3:formulate`; confidence 1; 'Concern' is a noun, but blank needs a verb after 'to'; 'formulate' fits grammatically and semantically.
- Blank 9: current `14:exacerbate` -> suggested `12:concern`; confidence 1; 'Exacerbate' is a verb, but blank needs a noun as subject; 'concern' fits grammatically and semantically.
- Blank 10: current `8:enhanced` -> suggested `14:exacerbate`; confidence 1; 'Enhanced' is a past participle, but modal 'may' requires base verb; 'exacerbate' fits grammatically and semantically.

### banked_cloze-bp-cet6-j07w1s
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: The rapid advancement of artificial intelligence has (1) a profound impact on various industries, from healthcare to finance. However, this progress also brings (2) challenges that
- Blank 2: current `1:fear` -> suggested `3:significant`; confidence 0.95; 'brings fear challenges' is ungrammatical; 'significant challenges' is the correct collocation.

### banked_cloze-bp-cet6-j2o1mh
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where digital devices are (1) integrated into every aspect of our lives, the concept of a “digital detox” has gained considerable traction. Many people, feeling (2) by co
- Blank 4: current `9:pledge` -> suggested `1:voluntarily`; confidence 0.9; 'pledge' is a verb but the blank requires an adverb to modify 'to use'; 'voluntarily' fits the context of choosing to use an app.

### banked_cloze-bp-cet6-j68n7f
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an age where screens dominate our daily lives, the concept of a digital detox has gained considerable (1). Many people feel an (2) urge to disconnect from their devices, hoping 
- Blank 10: current `5:familiar` -> suggested `10:irresistible`; confidence 0.95; 'feel familiar' contradicts the idea that offline activities are difficult in a world of instant gratification; 'irresistible' (tempting but hard to choose) fits the paradox and the contrast with 'instant gratification'.

### banked_cloze-bp-cet6-jqunmu
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era of constant connectivity, a growing number of people are embracing digital minimalism—a lifestyle that (1) intentional use of technology. Proponents argue that reducing s
- Blank 5: current `12:price` -> suggested `13:costs`; confidence 0.9; 'price' is singular and less idiomatic with 'high'; 'costs' (plural) is the standard collocation for negative consequences of programs.

### banked_cloze-bp-cet6-p56twp
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where screens dominate our daily lives, the concept of a “digital detox” has gained remarkable (1). Many people, feeling overwhelmed by constant notifications, are now se
- Blank 3: current `1:conceal` -> suggested `8:barrier`; confidence 0.9; 'Conceal' means to hide, but the irony is not hidden; the tools embody or become a barrier, making 'barrier' the correct fit.
- Blank 9: current `10:fragile` -> suggested `5:ignore`; confidence 0.95; 'Fragile' is an adjective but the parallel structure requires a verb; 'ignore' fits as a verb meaning 'defies' simple solutions, matching the intended meaning.

### banked_cloze-bp-cet6-p7qic3
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In recent years, the concept of digital minimalism has gained considerable (1) among those seeking to reduce screen time. However, a new study suggests that this trend may carry an
- Blank 3: current `14:temporary` -> suggested `0:significant`; confidence 0.85; Context describes a negative effect of abrupt reduction; 'temporary' implies it fades, but the passage does not support that. 'Significant' (large) fits better.
- Blank 10: current `8:awareness` -> suggested `6:consistency`; confidence 0.8; The passage advocates mindful engagement and gradual reduction; 'lack of consistency' (balanced habits) fits the theme better than 'awareness', which is too vague.

### banked_cloze-bp-cet6-qvmnje
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era where digital devices are omnipresent, the concept of a “digital detox” has gained considerable (1) . Many people feel a constant urge to check their phones, a behavior t
- Blank 9: current `7:foster` -> suggested `0:acknowledging`; confidence 1; Parallel structure requires a gerund after 'cultivating'; 'foster' is a base verb, ungrammatical here.
- Blank 10: current `0:acknowledging` -> suggested `7:foster`; confidence 1; Infinitive 'to' requires a base verb; 'acknowledging' is a gerund, ungrammatical.

### banked_cloze-bp-cet6-s53nw9
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time to improve mental well-being. However, this practice m
- Blank 4: current `12:anxiety` -> suggested `4:complain`; confidence 0.95; 'began to' requires a verb; 'anxiety' is a noun and ungrammatical here.

### banked_cloze-bp-cet6-t3ysmy
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: As cities continue to expand, the (1) of green spaces has become a pressing concern for urban planners. These areas not only provide (2) benefits but also contribute to mental well
- Blank 1: current `1:significance` -> suggested `12:scarcity`; confidence 0.9; The pressing concern is the lack of green spaces, not their importance.

### banked_cloze-bp-cet6-xn3psd
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: In an era defined by instant communication, we find ourselves grappling with a peculiar (1) . While technology has enabled us to connect with people across the globe, it has simult
- Blank 5: current `7:superficial` -> suggested `1:discriminating`; confidence 0.9; 'superficial' contradicts the intended meaning of careful, selective use; 'discriminating' fits better.

### banked_cloze-bp-cet6-zmnl01
- Type: banked_cloze; exam: CET-6; level: lv4
- Passage: Sleep, often taken for granted, is far more than a period of rest. It is a complex biological process that (1) our physical and mental health. In modern society, however, chronic s
- Blank 5: current `2:ignore` -> suggested `4:err`; confidence 0.95; 'err to believe' is a fixed collocation; 'ignore to believe' is ungrammatical.

### seven_select-sp-kaoyan-12e4w1y
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, algorithms have increasingly taken over tasks once reserved for human judgment, from hiring to criminal sentencing. Proponents argue that data-driven decisions eli
- Blank 2: current `3:Yet this very reliance on data can introduce hidden biases that are hard to identify.` -> suggested `1:Without proper oversight, these feedback loops can escalate into serious social harms.`; confidence 0.9; The preceding sentence describes a self-reinforcing loop; B directly refers to 'these feedback loops' and escalation, maintaining coherence. D introduces a new idea about hidden biases, which is less connected.
- Blank 3: current `1:Without proper oversight, these feedback loops can escalate into serious social harms.` -> suggested `0:The algorithm’s decisions are often treated as objective truths, further entrenching systemic discrimination.`; confidence 0.85; The preceding sentence discusses opacity making bias detection difficult; A logically continues by stating decisions are treated as objective truths, entrenching discrimination. B's escalation of feedback loops is less directly tied.

### seven_select-sp-kaoyan-13atfbm
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Urban green spaces, such as parks and community gardens, are often celebrated for their environmental and social benefits. (1) However, a growing body of research suggests that the
- Blank 1: current `6:Despite these benefits, the social costs of green spaces are often overlooked in urban planning.` -> suggested `1:Green spaces have been proven to reduce air pollution and lower temperatures in cities.`; confidence 0.9; Option G creates a double contrast with the following 'However', disrupting flow. A benefit statement like B fits better before the contrast.
- Blank 5: current `2:The benefits of urban parks are widely recognized by city governments around the world.` -> suggested `6:Despite these benefits, the social costs of green spaces are often overlooked in urban planning.`; confidence 0.85; Option C is a generic benefit statement that does not connect to the preceding examples or lead to the concluding call for weighing costs. Option G directly contrasts benefits with overlooked costs, setting up the conclusion.

### seven_select-sp-kaoyan-13xjbjd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices dominate every aspect of daily life, a growing number of individuals are turning to digital minimalism as a conscious lifestyle choice. (1) This mov
- Blank 2: current `2:Instead, they advocate for a complete abandonment of all digital devices.` -> suggested `1:Some people find it impossible to disconnect completely from their online obligations.`; confidence 0.9; Option C contradicts the proponents' moderate stance; option B provides a realistic counterpoint that fits the critical perspective.
- Blank 3: current `1:Some people find it impossible to disconnect completely from their online obligations.` -> suggested `2:Instead, they advocate for a complete abandonment of all digital devices.`; confidence 0.85; Option B does not logically lead to the examples of remote workers and families; option C, though extreme, is a plausible extreme view that contrasts with the examples, but the passage's flow better supports option C as a contrasting extreme claim followed by examples showing its impracticality.

### seven_select-sp-kaoyan-14mq310
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices dominate our daily routines, a growing number of individuals are embracing digital minimalism—a lifestyle that intentionally reduces screen time. (1
- Blank 1: current `1:Yet the hidden price of this disconnection is rarely discussed in popular discourse.` -> suggested `0:Digital minimalists often report improved sleep and deeper face-to-face interactions.`; confidence 0.9; The passage introduces digital minimalism, then says 'beneath this seemingly virtuous choice lies a subtle but significant cost'. Option A provides the positive benefits that make the choice seem virtuous, setting up the contrast with the hidden cost. Option B prematurely mentions the hidden price before the benefits are stated, breaking the logical flow.

### seven_select-sp-kaoyan-14u2sjz
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our own hands, the boundary between being connected and being overwhelmed has grown increasingly thin. (1) Yet this consta
- Blank 3: current `5:F. These findings challenge the long-held assumption that multitasking is an efficient way to handle modern workloads.` -> suggested `0:A. Smartphones and social media platforms are engineered to exploit our psychological vulnerabilities, making it harder to resist their pull.`; confidence 0.9; Option F directly references 'these findings' and introduces the multitasking assumption that the Stanford study challenges, creating coherent flow. Option A is too general and does not connect to the study.
- Blank 4: current `0:A. Smartphones and social media platforms are engineered to exploit our psychological vulnerabilities, making it harder to resist their pull.` -> suggested `5:F. These findings challenge the long-held assumption that multitasking is an efficient way to handle modern workloads.`; confidence 0.85; Blank 4 follows the Stanford study on multitasking. Option F directly comments on that study's implications, while Option A is a general statement that fits better earlier. The current placement disrupts the logical sequence from study to its implication.

### seven_select-sp-kaoyan-152kvhv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of our lives, a growing number of individuals are embracing digital minimalism as a conscious lifestyle choice. (1) At its cor
- Blank 3: current `6:However, the movement has also faced accusations of being a privilege reserved for those with flexible schedules and stable incomes.` -> suggested `5:Critics also point out that digital minimalism may exacerbate existing inequalities, as not everyone can afford to disconnect.`; confidence 0.85; The preceding sentence introduces critics' contention; option F directly continues the critics' argument about inequality, while G shifts to a new accusation about privilege that is less coherent.

### seven_select-sp-kaoyan-15qwb1x
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age of information overload, an increasing number of professionals are embracing digital minimalism — a lifestyle that intentionally reduces screen time to reclaim focus and 
- Blank 3: current `5:These boundaries might include turning off non-essential alerts or scheduling device-free hours.` -> suggested `0:Many people find it difficult to disconnect from their devices even during vacations.`; confidence 0.85; The current option F introduces 'boundaries' without prior reference, while the suggested option A provides a relatable difficulty that contrasts with the following sentence about digital minimalists' success.
- Blank 4: current `0:Many people find it difficult to disconnect from their devices even during vacations.` -> suggested `5:These boundaries might include turning off non-essential alerts or scheduling device-free hours.`; confidence 0.9; The current option A is a general statement that fits better earlier; the suggested option F directly specifies the 'strict boundaries' mentioned in the preceding sentence.

### seven_select-sp-kaoyan-18jevot
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has emerged as a counter-movement to the overwhelming presence of technology in daily life. (1) Yet a growing number of people are choosing to d
- Blank 3: current `6:These benefits, however, come at the cost of missing out on important online updates.` -> suggested `5:Critics argue that digital minimalism is a privilege available only to those with flexible jobs.`; confidence 0.8; The passage lists benefits then describes positive effects; inserting a negative cost here disrupts the flow. Option F (critics) introduces a challenge more naturally after the benefits, leading into the next sentence about challenges.
- Blank 5: current `2:This selective approach distinguishes minimalists from those who simply abandon technology altogether.` -> suggested `6:These benefits, however, come at the cost of missing out on important online updates.`; confidence 0.75; The passage ends with a concluding statement about the goal; inserting a sentence about selective approach here is out of place. Option G (cost of missing updates) fits better as a final nuance before the concluding sentence.

### seven_select-sp-kaoyan-196lope
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where smartphones and social media dominate daily life, the concept of being constantly connected has become an unspoken expectation. (1) This phenomenon, often celebrate
- Blank 3: current `3:These findings highlight the importance of digital detox practices in modern life.` -> suggested `2:C. Consequently, the quality of sleep has also been shown to suffer due to late-night screen use.`; confidence 0.85; Blank 3 follows a specific study and precedes a general point about fragmented attention; D is a concluding remark that fits better after all evidence, while C logically continues the chain of negative effects.
- Blank 5: current `5:This shift can lead to a decline in the depth of emotional bonds between people.` -> suggested `3:D. These findings highlight the importance of digital detox practices in modern life.`; confidence 0.8; Blank 5 is the final sentence before the concluding recommendation; D provides a natural summary of preceding evidence and leads into the experts' advice, while F introduces a new specific consequence less fitting as a concluding remark.

### seven_select-sp-kaoyan-1adec3z
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The academic publishing industry has undergone profound transformations over the past two decades, driven largely by digital technology and shifting attitudes toward knowledge shar
- Blank 2: current `6:Many funding agencies now require grant recipients to publish their findings in open-access venues.` -> suggested `2:Some established publishers have responded by launching their own open-access initiatives.`; confidence 0.85; Option G introduces a new external factor, while Option C directly follows the rise of open-access journals and contrasts with the next criticism.
- Blank 5: current `2:Some established publishers have responded by launching their own open-access initiatives.` -> suggested `6:Many funding agencies now require grant recipients to publish their findings in open-access venues.`; confidence 0.8; Option C fits better at blank 2; Option G provides a broader institutional driver leading to the concluding hybrid model.

### seven_select-sp-kaoyan-1empwbv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, intentionally reducing their screen time to reclaim focus and mental well-being. (1) However, a closer
- Blank 3: current `2:Some studies even suggest that moderate, intentional use of digital tools can enhance rather than harm well-being.` -> suggested `5:The pressure to constantly stay connected is often cited as a major source of modern anxiety.`; confidence 0.85; Option C introduces a positive note about moderate use, which disrupts the negative flow about cognitive load and hidden costs; Option F logically continues the discussion of pressure and anxiety.

### seven_select-sp-kaoyan-1ev4vpv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and online distractions. (1) However, this seemingly l
- Blank 2: current `0:Many proponents argue that stepping away from devices fosters deeper concentration and real-world relationships.` -> suggested `4:Critics, however, contend that constant connectivity impairs memory retention and emotional stability.`; confidence 0.85; The current option A introduces proponents of minimalism, but the preceding sentence discusses cognitive benefits of digital engagement, and the following sentence gives an example of attentional flexibility. Option E provides a contrasting view that logically leads into the example, maintaining coherence.

### seven_select-sp-kaoyan-1eyngtv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones have become extensions of our hands, the concept of a ‘digital detox’ has gained considerable traction. Many individuals, overwhelmed by the constant ba
- Blank 3: current `2:C. Critics argue that the benefits of digital detox are often exaggerated by wellness industries.` -> suggested `1:B. The pressure to maintain a curated online persona can be psychologically draining.`; confidence 0.85; Option C about exaggerated benefits of detox is off-topic; the paragraph discusses the positive functions of connectivity, and Option B provides a relevant counterpoint before shifting to the value of digital ties.
- Blank 5: current `1:B. The pressure to maintain a curated online persona can be psychologically draining.` -> suggested `5:F. A more sustainable approach, researchers suggest, involves setting boundaries rather than total abstinence.`; confidence 0.9; Option B about online persona pressure is a non sequitur; the preceding sentence introduces mindful engagement and curating, which Option F directly echoes.

### seven_select-sp-kaoyan-1i2xgop
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often mistaken for productivity, a growing number of professionals are turning to digital minimalism as a conscious strategy to reclaim focus. (1) T
- Blank 2: current `5:This practice, known as ‘time-boxing,’ allows the brain to enter deeper states of flow without interruption.` -> suggested `1:The constant pings and alerts have been shown to fragment concentration and reduce cognitive performance.`; confidence 0.85; The example of disabling notifications leads naturally to a statement about the harm of pings, not an unrelated definition of time-boxing.
- Blank 3: current `2:Many find that scheduling offline hours in the evening helps recalibrate their sleep patterns.` -> suggested `6:After the initial discomfort, however, most users report a surprising sense of liberation and mental clarity.`; confidence 0.9; The preceding sentence mentions initial withdrawal anxiety, so a contrast with later liberation fits better than a new unrelated practice.
- Blank 4: current `6:After the initial discomfort, however, most users report a surprising sense of liberation and mental clarity.` -> suggested `2:Many find that scheduling offline hours in the evening helps recalibrate their sleep patterns.`; confidence 0.8; After the adaptation period and benefits, a specific beneficial practice is more logical than repeating the liberation theme.

### seven_select-sp-kaoyan-1i3zhv7
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where smartphones have become extensions of our hands, the line between being connected and being overwhelmed has grown increasingly thin. (1) Yet, beneath the surface of
- Blank 2: current `1:Social media platforms are designed to exploit this vulnerability, keeping users hooked through unpredictable rewards.` -> suggested `6:The pressure to respond instantly to messages and emails has created a culture of perpetual urgency.`; confidence 0.85; Option B's 'this vulnerability' lacks a clear antecedent; G directly follows the introduction of digital fatigue and its manifestations.
- Blank 4: current `2:However, completely unplugging from the digital world is neither practical nor desirable for most people.` -> suggested `0:We check our phones an average of 96 times a day, often without any conscious trigger.`; confidence 0.9; A provides concrete evidence supporting the preceding study about cognitive capacity; C introduces a contrast that is premature before the detox recommendation.
- Blank 5: current `4:Instead, they recommend setting specific boundaries, such as no-phone zones during meals or before bedtime.` -> suggested `2:However, completely unplugging from the digital world is neither practical nor desirable for most people.`; confidence 0.9; C logically contrasts the detox suggestion, and then E's 'Instead' follows naturally; E alone has unclear 'they' and is better placed after C.

### seven_select-sp-kaoyan-1iuqr2w
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In the pursuit of higher efficiency, many graduate students pride themselves on their ability to juggle multiple tasks simultaneously. They check emails while listening to lectures
- Blank 4: current `5:Such practices not only reduce stress but also improve the quality of both academic work and personal life.` -> suggested `6:G. Therefore, the key is not to do more in less time, but to do less with more focus.`; confidence 0.9; F refers to 'such practices' but no practices have been introduced yet; G provides a logical conclusion before the final sentence about breaking the habit.
- Blank 5: current `6:Therefore, the key is not to do more in less time, but to do less with more focus.` -> suggested `5:F. Such practices not only reduce stress but also improve the quality of both academic work and personal life.`; confidence 0.9; Blank 5 follows mention of 'focus blocks'; F naturally refers back to 'such practices' and describes benefits, leading into the challenge of breaking the habit.

### seven_select-sp-kaoyan-1j7801f
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In contemporary consumer culture, individuals are often confronted with an overwhelming array of options, from basic necessities to luxury goods. (1) This abundance, rather than fo
- Blank 1: current `4:Yet, the modern economy relentlessly promotes endless choice as a sign of freedom and prosperity.` -> suggested `0:However, the problem is not merely about having too many products on the shelf.`; confidence 0.9; Option E shifts to a general economic observation, while the passage needs a direct elaboration on the paradox introduced. Option A provides a logical contrast and clarifies the issue.

### seven_select-sp-kaoyan-1jsepwb
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices are ubiquitous, a growing number of people are embracing the concept of a 'digital detox' — a period during which they voluntarily refrain from usin
- Blank 2: current `6:Yet, the same study also noted that most participants resumed their old habits within two weeks.` -> suggested `3:D. Despite its popularity, the long-term benefits of digital detox remain unproven in large-scale studies.`; confidence 0.9; Option G refers to 'the same study' but no study has been mentioned before blank 2; the preceding sentence introduces a study, so G would be premature. Option D provides a logical contrastive point that fits the flow.

### seven_select-sp-kaoyan-1jwhwli
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era defined by unprecedented access to information, the modern consumer faces a curious dilemma. While the abundance of options was once hailed as a hallmark of freedom, rece
- Blank 3: current `3:Social media platforms further amplify this effect by constantly showcasing the curated lives of others.` -> suggested `2:These mechanisms often cause shoppers to delay purchases or abandon their carts altogether.`; confidence 0.9; The preceding sentence introduces two psychological mechanisms; option C directly refers to 'these mechanisms' and describes their behavioral consequences, maintaining logical coherence. Option D introduces a new topic (social media) without a clear link.

### seven_select-sp-kaoyan-1k8vpuu
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Every year, thousands of startups emerge with innovative ideas and ambitious founders. Yet only a handful manage to grow beyond the initial phase and achieve sustainable scaling. (
- Blank 4: current `6:In contrast, companies that scale successfully tend to invest heavily in automation and standardized procedures.` -> suggested `3:These challenges are often compounded by a lack of strategic planning.`; confidence 0.85; Option D directly references the preceding external pressures and leads into the need for adaptation, while G introduces an unrelated contrast about automation.

### seven_select-sp-kaoyan-1n3izbj
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and online distractions. (1) This trend is often prais
- Blank 2: current `1:Yet the cognitive demands of the digital age require exactly those abilities that constant connectivity fosters.` -> suggested `5:Some researchers have even linked moderate social media use to improved emotional regulation and empathy.`; confidence 0.85; Option B is a general statement that does not logically follow the preceding sentence about cognitive skill atrophy; option F provides a contrasting research finding that directly supports the idea that digital exposure has benefits, fitting the context better.

### seven_select-sp-kaoyan-1nip3rd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and curbing reliance on social media. Proponents argue
- Blank 2: current `3:This privilege is not available to everyone, especially those whose livelihoods depend on constant online presence.` -> suggested `1:Critics also point out that the advice to 'unplug' is often given by those who can afford to hire assistants to manage their digital chores.`; confidence 0.85; The 'Moreover' lead-in requires a continuation of the critique about privilege; option B directly addresses the hypocrisy of advice-givers, while D merely restates the privilege idea without advancing the argument.
- Blank 3: current `4:Such a perspective fails to account for the digital divide that persists across socioeconomic lines.` -> suggested `3:This privilege is not available to everyone, especially those whose livelihoods depend on constant online presence.`; confidence 0.9; The preceding sentence introduces marginalized groups who rely on digital tools for survival; option D directly states that the privilege of disconnecting is unavailable to them, creating a logical contrast. Option E is too generic and does not connect to the specific examples.
- Blank 4: current `2:The irony is that the very tools we seek to escape are the ones that keep many people afloat.` -> suggested `4:Such a perspective fails to account for the digital divide that persists across socioeconomic lines.`; confidence 0.8; The blank follows a sentence about marginalized groups using digital tools for networking and support; option E critiques the romanticized low-tech lifestyle mentioned in the next sentence, creating a coherent flow. Option C introduces a new ironic observation that is less connected.

### seven_select-sp-kaoyan-1ond3r3
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and curbing reliance on social media. (1) Yet beneath 
- Blank 2: current `5:Without realizing it, they trade one screen for another, albeit with a different purpose.` -> suggested `2:This constant vigilance defeats the very purpose of reducing mental clutter.`; confidence 0.85; Blank 2 follows 'constant monitoring of one’s own behavior, which can become another form of mental labor'; 'This constant vigilance' directly refers to that, while F introduces a new metaphor too early.
- Blank 3: current `6:The same applies to those who switch from Instagram to note-taking apps.` -> suggested `5:Without realizing it, they trade one screen for another, albeit with a different purpose.`; confidence 0.8; Blank 3 follows the example of deleting social media and researching offline tools; F's 'trade one screen for another' fits that example, while G's 'same applies' is vague without a clear antecedent.
- Blank 4: current `3:These activities, ironically, consume the same time and attention they sought to save.` -> suggested `6:The same applies to those who switch from Instagram to note-taking apps.`; confidence 0.8; Blank 4 follows the example of researching productivity tools; G's 'same applies' directly extends that example, while D's 'these activities' is too generic and disrupts the flow.
- Blank 5: current `2:This constant vigilance defeats the very purpose of reducing mental clutter.` -> suggested `3:These activities, ironically, consume the same time and attention they sought to save.`; confidence 0.75; Blank 5 concludes the paragraph before the final sentence; D's 'these activities' summarizes the examples, while C's 'constant vigilance' is too narrow and better placed earlier.

### seven_select-sp-kaoyan-1ow4y5x
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices have become ubiquitous, the line between being connected and being overwhelmed has grown increasingly thin. (1) This constant connectivity, while be
- Blank 2: current `0:Many people mistakenly believe that more connectivity automatically leads to greater productivity.` -> suggested `6:Interestingly, younger generations, despite being digital natives, are not immune to these effects.`; confidence 0.9; Option A introduces a new topic about productivity belief, breaking the logical flow from phone-checking frequency to digital fatigue definition. Option G directly continues the discussion of effects on people and links to 'these effects'.

### seven_select-sp-kaoyan-1p2ducp
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of professionals have embraced digital minimalism, deliberately reducing their screen time to enhance productivity and mental well-being. (1) Yet 
- Blank 4: current `6:Similarly, a manager who turned off notifications during deep work hours was praised for his efficiency.` -> suggested `2:However, some participants found that their productivity actually decreased due to the lack of instant communication.`; confidence 0.9; Option G breaks the negative consequence pattern; Option C maintains it and fits the context.

### seven_select-sp-kaoyan-1q0a0m
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In our hyper-connected world, the ability to juggle multiple tasks simultaneously is often celebrated as a hallmark of efficiency. (1) However, a growing body of cognitive research
- Blank 2: current `2:Nevertheless, the human brain is not designed for parallel processing of complex information.` -> suggested `1:This switching penalty can reduce overall productivity by as much as 40 percent, according to some studies.`; confidence 0.9; Blank 2 follows the definition of switching penalty; B directly elaborates on that penalty, while C introduces a new contrast that disrupts the flow.
- Blank 3: current `1:This switching penalty can reduce overall productivity by as much as 40 percent, according to some studies.` -> suggested `2:Nevertheless, the human brain is not designed for parallel processing of complex information.`; confidence 0.85; After discussing the switching penalty, a general statement about brain design fits better before the specific example in blank 4; B is too specific for blank 3.

### seven_select-sp-kaoyan-1q9y69p
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The pandemic has fundamentally reshaped the way we work, with remote employment becoming a permanent fixture for many industries. (1) However, beneath the surface of flexibility an
- Blank 4: current `1:This sense of loneliness often leads to higher turnover rates among remote teams.` -> suggested `5:The erosion of work-life boundaries has been linked to a 30% increase in burnout symptoms among remote employees.`; confidence 0.85; Blank 4 follows a sentence about metrics measuring presence, not loneliness; the erosion of boundaries (F) directly connects to the irony of metrics and busywork.

### seven_select-sp-kaoyan-1t4eno6
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Scientific progress is often portrayed as a linear process of hypothesis, experimentation, and conclusion. Yet history reveals that many groundbreaking discoveries owe their existe
- Blank 1: current `0:It refers to the ability to find valuable things by accident when not looking for them.` -> suggested `2:Rather, it requires a mindset that can pivot from a planned path to an unanticipated one.`; confidence 0.9; Option A redundantly redefines serendipity after the passage already defines it; Option C logically continues the contrast 'not merely luck' and introduces the needed mindset.
- Blank 3: current `2:Rather, it requires a mindset that can pivot from a planned path to an unanticipated one.` -> suggested `0:It refers to the ability to find valuable things by accident when not looking for them.`; confidence 0.85; After 'serendipity is not merely luck', a definition of serendipity clarifies the term, while Option C is about pivoting mindset, which fits better elsewhere.

### seven_select-sp-kaoyan-1tinvle
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our hands, the benefits of constant connectivity are widely celebrated. (1) This phenomenon, often referred to as 'techno-
- Blank 3: current `5:F. Such tools, while helpful, often fail to address the root cause: the addictive design of the platforms themselves.` -> suggested `1:B. Critics, however, argue that these measures are merely band-aid solutions, as the core algorithm design remains geared toward maximizing user engagement.`; confidence 0.9; The preceding sentence introduces 'focus mode' and 'digital wellbeing' tools; B directly responds to these measures, while F ('Such tools...') would be redundant before B and disrupts the logical flow. The current key reverses the natural order.
- Blank 4: current `1:B. Critics, however, argue that these measures are merely band-aid solutions, as the core algorithm design remains geared toward maximizing user engagement.` -> suggested `5:F. Such tools, while helpful, often fail to address the root cause: the addictive design of the platforms themselves.`; confidence 0.9; After B criticizes the measures as band-aid solutions, F naturally elaborates on why they fail, creating a coherent sequence. The current placement of B after F is disjointed.

### seven_select-sp-kaoyan-1tmkyr8
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The digital age has brought unprecedented convenience to our daily lives. From online shopping to instant communication, technology has streamlined countless tasks that once requir
- Blank 2: current `1:Surprisingly, the energy consumption of data centers has doubled over the past decade.` -> suggested `2:This makes it one of the fastest-growing contributors to environmental degradation.`; confidence 0.9; Option B introduces a new fact about doubling energy consumption, which disrupts the logical flow; Option C directly refers to the preceding sentence and leads naturally into the next sentence about emissions.
- Blank 3: current `2:This makes it one of the fastest-growing contributors to environmental degradation.` -> suggested `1:Surprisingly, the energy consumption of data centers has doubled over the past decade.`; confidence 0.85; Option C is too general after the specific emission figure; Option B provides a specific, surprising statistic that supports the claim and transitions to the water example.

### seven_select-sp-kaoyan-1tyk35v
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: For decades, mainstream economics has relied on the assumption that individuals make decisions based on complete information and rational calculation. This model, known as Homo eco
- Blank 3: current `4:Even experts, such as professional traders and judges, are not immune to these cognitive pitfalls.` -> suggested `2:The impact of these biases is not limited to laboratory settings but extends to real-world financial markets.`; confidence 0.85; Blank 3 follows a specific lab experiment on anchoring; the next sentence should generalize from lab to real world, not jump to experts. Option C provides a logical bridge, while E fits better after C or later.

### seven_select-sp-kaoyan-1u50xss
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices dominate our attention, a growing number of individuals are embracing digital minimalism—a philosophy that advocates intentional use of technology. 
- Blank 3: current `1:Many find it liberating to disconnect from notifications and algorithms.` -> suggested `3:D. The rise of remote work has further blurred the line between necessary and excessive use.`; confidence 0.85; Option B is a positive statement about liberation, but the context is critical (social isolation). Option D introduces a real-world factor that exacerbates the tension, fitting better.

### seven_select-sp-kaoyan-1uwnuqb
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices permeate every aspect of daily life, a growing number of individuals are embracing digital minimalism as a conscious lifestyle choice. (1) This phil
- Blank 5: current `2:A 2023 study found that participants who limited social media to 30 minutes daily experienced a significant reduction in anxiety levels.` -> suggested `5:F. Balancing digital engagement with real-world connections remains a nuanced challenge that varies across individuals and contexts.`; confidence 0.9; Option C introduces new evidence at the end, which disrupts the concluding flow; F provides a balanced summary leading naturally to the final sentence.

### seven_select-sp-kaoyan-1vm9826
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often mistaken for productivity, a growing number of professionals are embracing digital minimalism — a deliberate reduction in the use of digital t
- Blank 4: current `5:Proponents of digital minimalism often cite improved mental health as a key benefit.` -> suggested `0:Supporters claim that this practice restores focus and reduces anxiety.`; confidence 0.8; Blank 4 follows a sentence about 'intentional usage' and 'mitigating disruptive effects'; F repeats the idea of proponents already introduced, while A's 'this practice' refers back to the nuanced approach and fits better.

### seven_select-sp-kaoyan-1w5tjb6
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices constantly vie for our attention, a growing number of individuals are embracing the philosophy of digital minimalism. (1) This approach, however, do
- Blank 3: current `0:A. It is about intentionally reducing screen time to focus on what truly matters.` -> suggested `5:F. The key is to replace passive consumption with active engagement.`; confidence 0.85; Option A is a general definition that fits earlier; blank 3 follows research on fragmentation and precedes a sentence about reclaiming time for deep work, so F directly addresses the problem-solution link.
- Blank 5: current `5:F. The key is to replace passive consumption with active engagement.` -> suggested `3:D. Proponents of digital minimalism often report higher levels of life satisfaction.`; confidence 0.8; Option F is a general principle that fits earlier; blank 5 is the final sentence before critics' caution, and D provides a positive claim that contrasts naturally with 'Nevertheless, critics caution...'.

### seven_select-sp-kaoyan-1xkn6g2
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The peer review system has long been considered the cornerstone of scientific publishing, ensuring that only rigorous research reaches the public domain. (1) However, in recent yea
- Blank 3: current `2:C. These alternatives, however, still lack the credibility that comes with formal peer review.` -> suggested `3:D. This has led to a growing number of calls for alternative models.`; confidence 0.85; Sentence C refers to 'these alternatives' but the preceding text only introduces open peer review and preprint servers as experiments, not as a set of alternatives already established; D logically follows the discussion of experiments and leads into 'Yet, even with these innovations'.

### seven_select-sp-kaoyan-1xuzuyd
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our hands, the boundary between work and personal life has grown increasingly blurred. (1) This constant connectivity, whi
- Blank 2: current `3:Without deliberate effort, the very tools designed to liberate us can become sources of chronic stress.` -> suggested `6:Moreover, the constant influx of notifications fragments attention and reduces deep work capacity.`; confidence 0.85; Blank 2 follows a sentence about checking phones 150 times a day during leisure hours; G directly continues the idea of notification influx and its effect, while D is a general statement that fits better later.
- Blank 3: current `6:Moreover, the constant influx of notifications fragments attention and reduces deep work capacity.` -> suggested `3:Without deliberate effort, the very tools designed to liberate us can become sources of chronic stress.`; confidence 0.8; Blank 3 follows a definition of techno-stress; D provides a logical consequence (without effort, tools cause stress), while G's 'Moreover' would be redundant after the definition and before the example.

### seven_select-sp-kaoyan-1yh3wxq
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices dominate every aspect of our lives, a growing number of individuals are turning to digital minimalism as a remedy for information overload. (1) This
- Blank 3: current `2:Many people report feeling overwhelmed by the sheer volume of notifications and emails they receive daily.` -> suggested `6:These findings have sparked interest among employers who see potential productivity gains.`; confidence 0.9; Blank 3 follows research findings about digital detox benefits; option G directly references 'These findings' and extends the idea to employer interest, while C introduces a new topic about feeling overwhelmed, breaking coherence.
- Blank 4: current `0:Digital minimalism does not mean abandoning smartphones or laptops altogether.` -> suggested `2:Many people report feeling overwhelmed by the sheer volume of notifications and emails they receive daily.`; confidence 0.85; Blank 4 follows a sentence about the challenge of maintaining habits; C provides a reason for the challenge (overwhelmed by notifications), while A introduces a definition that fits better later. The flow from challenge to cause is more natural.

### seven_select-sp-kaoyan-1yobexo
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices permeate every aspect of daily life, a growing number of individuals are embracing digital minimalism as a conscious countermeasure. (1) This philos
- Blank 1: current `0:Digital minimalism, however, is not a one-size-fits-all solution and requires personal adaptation.` -> suggested `4:Moreover, the constant influx of notifications can fragment attention and increase stress levels.`; confidence 0.9; Option E directly supports the preceding claim about cognitive overload, while A introduces a caveat too early before the philosophy is fully explained.
- Blank 2: current `4:Moreover, the constant influx of notifications can fragment attention and increase stress levels.` -> suggested `0:Digital minimalism, however, is not a one-size-fits-all solution and requires personal adaptation.`; confidence 0.85; Option A provides a nuanced transition after proponents' views, leading naturally to the next sentence about cutting back; E is a supporting detail that fits better earlier.
- Blank 3: current `3:One popular strategy is the '30-day digital declutter', during which participants temporarily step back from optional technologies.` -> suggested `2:Some people, particularly those in creative fields, find that digital tools enhance their productivity rather than hinder it.`; confidence 0.9; Option C offers a contrasting perspective that logically precedes the remote worker example, while D introduces a strategy out of place here.
- Blank 4: current `5:These practices help individuals develop a healthier relationship with technology without feeling deprived.` -> suggested `3:One popular strategy is the '30-day digital declutter', during which participants temporarily step back from optional technologies.`; confidence 0.85; Option D provides a concrete example of the boundaries mentioned, while F lacks a clear antecedent for 'these practices'.

### seven_select-sp-kaoyan-3j9oqv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and limiting the use of social media. (1) Yet beneath 
- Blank 2: current `1:However, the unintended consequences of digital minimalism are often overlooked.` -> suggested `2:C. Some researchers even warn that extreme digital detox can trigger feelings of loneliness and boredom.`; confidence 0.9; Option B is too general and does not lead into the specific example of social isolation; Option C directly introduces the warning that matches the following sentence.

### seven_select-sp-kaoyan-4l0c5c
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices dominate our attention, a growing number of individuals are embracing digital minimalism — the intentional reduction of screen time to reclaim focus
- Blank 2: current `4:E. The findings underscore the need for further research into the long-term effects of digital detox.` -> suggested `6:G. Such findings have prompted some experts to call for a more nuanced understanding of digital well-being.`; confidence 0.85; Option E is too generic and breaks the logical flow; G provides a coherent bridge from the findings to their implications.
- Blank 4: current `6:G. Such findings have prompted some experts to call for a more nuanced understanding of digital well-being.` -> suggested `4:E. The findings underscore the need for further research into the long-term effects of digital detox.`; confidence 0.8; Option G is misplaced here; E fits as a concluding remark before the final sentence, maintaining coherence.

### seven_select-sp-kaoyan-5b9vla
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our hands, the line between being connected and being overwhelmed has grown increasingly thin. (1) Yet, beneath the surfac
- Blank 2: current `4:Consequently, a growing number of individuals are reporting symptoms of burnout linked directly to their online habits.` -> suggested `1:The constant comparison with others’ highlight reels on social media can trigger feelings of loneliness and low self-esteem.`; confidence 0.85; The current option E introduces a consequence (burnout) before the symptoms are fully elaborated, while the suggested option B directly exemplifies the symptoms of digital fatigue mentioned in the preceding sentence, creating a smoother logical flow.
- Blank 3: current `1:The constant comparison with others’ highlight reels on social media can trigger feelings of loneliness and low self-esteem.` -> suggested `5:For instance, a 2023 survey found that 68% of participants felt their social media usage negatively impacted their sleep quality.`; confidence 0.8; The current option B is a general claim that fits better as an elaboration of symptoms (blank 2), while the suggested option F provides a concrete example supporting the preceding statement about studies, improving coherence and evidential support.

### seven_select-sp-kaoyan-5sgf31
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The shift to remote work, accelerated by the pandemic, has reshaped the modern workplace in profound ways. (1) Yet a growing body of evidence suggests that this arrangement carries
- Blank 2: current `0:Many companies have reported significant cost savings from reduced office space and utilities.` -> suggested `6:Remote workers often report higher productivity due to fewer distractions and greater autonomy.`; confidence 0.9; Option A about cost savings is irrelevant after discussing erosion of informal learning; Option G provides a logical contrast and the following sentence 'this deficit' refers back to learning loss.
- Blank 3: current `3:These savings, however, must be weighed against the potential decline in innovation and employee well-being.` -> suggested `2:The absence of face-to-face interaction can weaken team cohesion and make employees feel disconnected from their colleagues.`; confidence 0.85; Option D about savings is off-topic after blurring boundaries and late-night emails; Option C about isolation and cohesion fits the context of constant connectivity leading to burnout and the next sentence about isolation.

### seven_select-sp-kaoyan-65zqiw
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, a lifestyle that advocates reducing screen time and online engagement to reclaim mental focus. (1) How
- Blank 3: current `0:Advocates argue that constant connectivity erodes attention spans and deep relationships.` -> suggested `3:The irony is that the very tools designed to connect us are now being blamed for disconnecting us.`; confidence 0.9; Option A is a general advocacy statement that does not follow 'This paradox suggests...'; Option D directly states the irony/paradox and fits the local coherence.

### seven_select-sp-kaoyan-76i0u9
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones and social media dominate daily life, the concept of digital minimalism has emerged as a counterweight to constant connectivity. (1) Yet, for many, the 
- Blank 3: current `6:Nevertheless, the pressure to remain available often overrides individual intentions to unplug.` -> suggested `2:The allure of instant gratification makes it difficult for people to resist the pull of notifications.`; confidence 0.9; The current option G introduces a contrast with 'Nevertheless', but the preceding sentence already describes a negative effect (fragmented attention), so a contrast is illogical. The suggested option C provides a causal explanation for the constant interruption, fitting the flow before the boundary-setting sentence.

### seven_select-sp-kaoyan-7fams5
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of daily life, a growing number of individuals are embracing the philosophy of digital minimalism. (1) This deliberate reducti
- Blank 2: current `5:They argue that the benefits of digital minimalism are often overstated and not supported by rigorous research.` -> suggested `1:B. Some studies even suggest that excessive screen time can rewire the brain, making sustained attention increasingly difficult.`; confidence 0.9; Blank 2 follows a claim about harm of constant connectivity and precedes a positive example of reducing notifications; Option B provides supporting evidence for the harm, while F introduces premature criticism that disrupts the flow.

### seven_select-sp-kaoyan-82970z
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Urban greening initiatives, such as planting trees and creating parks, have been widely promoted as solutions to environmental and social problems. (1) However, a growing body of r
- Blank 3: current `1:Many residents celebrate the arrival of new parks as a sign of urban renewal.` -> suggested `3:Policymakers often prioritize quick aesthetic improvements over long-term sustainability.`; confidence 0.9; Option B introduces a positive note that breaks the critical flow; Option D logically follows the discussion of non-native plants and leads to the conclusion of smaller net benefits.

### seven_select-sp-kaoyan-82a5pt
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of daily life, a growing number of individuals are embracing a counterintuitive lifestyle known as digital minimalism. (1) Thi
- Blank 2: current `2:Social media platforms, in particular, are often cited as primary culprits in eroding attention spans.` -> suggested `3:This sense of liberation, they argue, fosters deeper relationships and greater creativity in other areas of life.`; confidence 0.9; The preceding sentence describes benefits after scaling back social media; the suggested option directly continues that positive outcome, while the current option shifts to a negative topic about social media as culprits, disrupting the flow.

### seven_select-sp-kaoyan-96zp5z
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today’s hyperconnected world, the ability to juggle multiple tasks simultaneously is often celebrated as a hallmark of efficiency. (1) However, a growing body of cognitive resea
- Blank 2: current `2:Consequently, the quality of deep thinking and creative problem-solving suffers noticeably.` -> suggested `3:Studies show that even brief interruptions can double the error rate in complex tasks.`; confidence 0.85; Option D provides a concrete study result that directly supports the preceding mention of 'switching penalty', while Option C is a general consequence that fits better after the explanation of switching penalty and before the productivity reduction sentence.
- Blank 3: current `3:Studies show that even brief interruptions can double the error rate in complex tasks.` -> suggested `2:Consequently, the quality of deep thinking and creative problem-solving suffers noticeably.`; confidence 0.85; Option C directly states the consequence of impaired quality, fitting the logical flow after 'the illusion of multitasking can impair the quality of work' and before 'In professional settings, this fragmented attention often leads to more errors...' better than Option D, which is more specific and fits better earlier.

### seven_select-sp-kaoyan-9hunq0
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Scientific progress is often portrayed as a linear accumulation of knowledge, yet history reveals a far more complex reality. (1) This pattern challenges the conventional narrative
- Blank 5: current `1:Funding agencies now prioritize projects with clearly defined outcomes.` -> suggested `3:The resistance to new ideas can be as influential as the ideas themselves.`; confidence 0.9; Option B about funding priorities is irrelevant to the passage's concluding focus on embracing uncertainty and unexpected findings; option D directly supports the paradox discussed.

### seven_select-sp-kaoyan-9lp3cz
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of individuals have embraced digital minimalism, a lifestyle that advocates reducing screen time and curbing online distractions. (1) Yet beneath 
- Blank 4: current `5:On the other hand, some researchers warn that reducing digital exposure might weaken our capacity for deep focus.` -> suggested `6:Without these digital stimuli, individuals might find their ability to navigate ambiguity and engage in rapid problem-solving gradually diminished.`; confidence 0.9; Option F introduces an unnecessary contrast, while G directly follows the preceding examples and leads naturally into the conclusion.
- Blank 5: current `6:Without these digital stimuli, individuals might find their ability to navigate ambiguity and engage in rapid problem-solving gradually diminished.` -> suggested `-1:`; confidence 0.8; Option G is redundant here because the passage already contains a similar concluding sentence; blank 5 should be left empty or filled with a different option.

### seven_select-sp-kaoyan-9q54se
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of our hands, the boundary between online and offline existence grows increasingly porous. (1) This relentless connectivity, 
- Blank 5: current `5:F. Companies design these platforms specifically to maximize user engagement, often at the expense of user well-being.` -> suggested `4:E. Without such intentional practices, we risk becoming passive consumers of data rather than active shapers of our own thoughts.`; confidence 0.9; Option E directly refers to 'such intentional practices' from the preceding sentence about digital mindfulness, and leads naturally into the concluding call to reclaim cognitive autonomy. Option F introduces an unrelated topic about companies, disrupting the logical flow.

### seven_select-sp-kaoyan-9uzxao
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Artificial intelligence has revolutionized industries by automating complex tasks and optimizing resource allocation. (1) However, this efficiency often comes with a hidden environ
- Blank 1: current `0:The environmental impact of AI is a growing concern among policymakers.` -> suggested `4:These emissions contribute significantly to global carbon footprints.`; confidence 0.9; The preceding sentence discusses energy consumption and emissions; 'These emissions' directly links, while the current option is a generic topic sentence that disrupts flow.
- Blank 2: current `4:These emissions contribute significantly to global carbon footprints.` -> suggested `0:The environmental impact of AI is a growing concern among policymakers.`; confidence 0.85; The preceding sentence is about electronic waste, not emissions; the suggested option introduces a broader environmental concern that fits better after waste mention.

### seven_select-sp-kaoyan-aeen7y
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where instant messaging and social media dominate our daily routines, the concept of being constantly connected has become almost second nature. (1) However, beneath the 
- Blank 2: current `1:B. This constant partial attention comes at a price that many of us fail to recognize.` -> suggested `4:E. The digital world offers unparalleled convenience, but it also demands a cognitive tax that accumulates over time.`; confidence 0.85; Option E directly follows the 'brain drain' concept and leads into the example, while B introduces an unestablished idea.
- Blank 4: current `5:F. These micro-interruptions, though seemingly insignificant, collectively erode our ability to focus.` -> suggested `3:D. Even a brief glance at a notification can derail one's train of thought for up to 20 minutes.`; confidence 0.9; D provides a concrete example supporting the preceding claim about deep work fragmentation, while F is too generic.

### seven_select-sp-kaoyan-bakbss
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often equated with productivity, a growing number of individuals are embracing digital minimalism as a conscious lifestyle choice. (1) However, for 
- Blank 2: current `3:Research indicates that the average person checks their phone over 150 times per day.` -> suggested `0:Many tech executives themselves reportedly enforce strict screen rules for their children.`; confidence 0.85; The current option D is a general statistic that does not logically follow the preceding sentence about proponents arguing for limiting screen time. Option A provides a concrete example that supports the proponents' claim and maintains coherence.

### seven_select-sp-kaoyan-bcp8yc
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital devices have become extensions of ourselves, the line between virtual and real interactions has blurred considerably. (1) This phenomenon, often celebrated 
- Blank 3: current `2:Social media platforms are designed to be addictive, exploiting psychological vulnerabilities.` -> suggested `4:This constant comparison can erode self-esteem and create a sense of inadequacy.`; confidence 0.9; The preceding sentence discusses social comparison and anxiety; 'This constant comparison' directly and cohesively follows, while the current option introduces a new topic about addiction.
- Blank 4: current `4:This constant comparison can erode self-esteem and create a sense of inadequacy.` -> suggested `2:Social media platforms are designed to be addictive, exploiting psychological vulnerabilities.`; confidence 0.85; After discussing social comparison effects, the addictive nature of platforms provides a logical cause for the subsequent recommendation of boundaries; the current option repeats the comparison idea and disrupts the causal flow.

### seven_select-sp-kaoyan-bgtsfa
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today's hyper-connected world, the average knowledge worker switches tasks every three minutes, a rhythm that fragments attention and erodes deep thinking. (1) This constant int
- Blank 3: current `6:Therefore, it is crucial for individuals to schedule regular digital detox periods to restore mental clarity.` -> suggested `0:Studies show that even a single glance at a notification can trigger a cascade of distracting thoughts.`; confidence 0.85; The current option G is a general recommendation that fits better later; option A provides a supporting detail about notification harm, logically preceding the contrast in blank 4.
- Blank 5: current `1:Interestingly, the most innovative teams often have strict 'no-device' policies during brainstorming sessions.` -> suggested `2:Social media platforms are designed to exploit our psychological vulnerabilities, making them particularly addictive.`; confidence 0.8; Option B introduces a new example abruptly; option C provides a reason for digital noise, leading naturally into the concluding sentence.

### seven_select-sp-kaoyan-d32sbn
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: Urban sprawl, characterized by the uncontrolled expansion of urban areas into surrounding rural land, has long been a dominant pattern of development in many countries. (1) While t
- Blank 3: current `5:Without a critical reassessment of sprawl, cities risk perpetuating inequality and environmental harm for generations.` -> suggested `4:E. These environmental impacts alone should be enough to reconsider current planning policies.`; confidence 0.85; Option F is a concluding statement that fits better at the end; Option E directly follows the fiscal burden discussion and leads into the irony of declining amenities.

### seven_select-sp-kaoyan-d6vygf
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of digital minimalism has gained considerable traction among tech-savvy professionals seeking to reclaim their time and focus. (1) However, a growing b
- Blank 1: current `6:Yet the long-term effects of such a lifestyle remain underexplored in academic literature.` -> suggested `0:Advocates argue that reducing screen time enhances mental well-being and productivity.`; confidence 0.9; The passage opens with digital minimalism gaining traction; the next sentence should present the advocates' positive claim before the contrast 'However' introduces drawbacks. The current sentence about underexplored effects disrupts this logical flow.
- Blank 5: current `0:Advocates argue that reducing screen time enhances mental well-being and productivity.` -> suggested `6:Yet the long-term effects of such a lifestyle remain underexplored in academic literature.`; confidence 0.85; Blank 5 is the concluding sentence before the final summary; a sentence about underexplored long-term effects fits better as a concluding caveat than a restatement of advocates' claims, which already appeared earlier.

### seven_select-sp-kaoyan-dlosv2
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where multitasking is often celebrated as a productivity booster, a growing body of research suggests otherwise. The constant influx of notifications, emails, and instant
- Blank 3: current `1:Surprisingly, such measures have been shown to boost both individual output and team morale.` -> suggested `6:Without structural support, even the most disciplined individuals struggle to maintain deep work.`; confidence 0.9; Option B's 'such measures' has no antecedent; G bridges the cost of interruptions to the need for focus blocks.
- Blank 4: current `2:However, the true challenge is not technological but cultural.` -> suggested `1:Surprisingly, such measures have been shown to boost both individual output and team morale.`; confidence 0.85; Option B's 'such measures' refers to focus blocks, providing a positive outcome that contrasts with the next sentence's reluctance.
- Blank 5: current `6:Without structural support, even the most disciplined individuals struggle to maintain deep work.` -> suggested `2:However, the true challenge is not technological but cultural.`; confidence 0.9; Option C directly addresses organizational reluctance and leads into the concluding solution; G is redundant here.

### seven_select-sp-kaoyan-dozokk
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a lifestyle philosophy that advocates reducing screen time and decluttering one’s digital life. Proponents argue that con
- Blank 2: current `5:Without these connections, many patients report feeling isolated and abandoned.` -> suggested `0:These findings challenge the assumption that all digital interaction is inherently harmful.`; confidence 0.85; The current sentence is too generic and does not logically follow the specific example about patients; option A generalizes from the example and leads into the next sentence about remote workers.
- Blank 4: current `3:The key is to find a balance that works for each individual's unique circumstances.` -> suggested `6:This distinction is crucial for designing effective digital wellness interventions.`; confidence 0.9; The current answer is too generic and does not connect to the preceding study about moderate vs. passive use; option G directly refers to 'this distinction' and leads naturally to the next sentence about quality over quantity.

### seven_select-sp-kaoyan-ene180
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today’s fast-paced digital environment, the ability to juggle multiple tasks simultaneously is often celebrated as a sign of efficiency and competence. Many professionals pride 
- Blank 3: current `2:Nevertheless, some people insist that they can multitask effectively without any negative consequences.` -> suggested `6:Despite these findings, the glorification of multitasking persists in workplace culture.`; confidence 0.85; The current option 'Nevertheless' introduces a counterpoint too abruptly after the research evidence, while the suggested option better bridges the findings to the persistent cultural glorification and leads naturally to the academic context.

### seven_select-sp-kaoyan-flwpkg
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often equated with productivity, an increasing number of professionals are questioning the assumption that constant online presence is beneficial. (
- Blank 2: current `2:Critics also warn that extreme digital detox can exacerbate feelings of exclusion in professional circles.` -> suggested `1:Yet the challenge remains: how to balance the benefits of connectivity with the need for solitude.`; confidence 0.9; The current sentence repeats the critic's warning already given, while the suggested sentence introduces the central challenge that the following research addresses.

### seven_select-sp-kaoyan-h78dt6
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of daily life, a growing number of individuals are embracing a counterintuitive philosophy: digital minimalism. (1) This movem
- Blank 2: current `2:By contrast, digital minimalists view technology as a tool to be used with purpose, not a master to be served.` -> suggested `1:The irony, however, is that the very tools designed to connect us often leave us feeling more isolated.`; confidence 0.9; Option B provides a logical bridge from the negative effects of connectivity to the example of nomophobia, while C introduces an irrelevant contrast.

### seven_select-sp-kaoyan-h9ukqh
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones and social media dominate daily life, the concept of digital detox has gained considerable traction. Many people now recognize that constant connectivit
- Blank 3: current `2:Instead, they advocate for periodic digital fasts to reset attention spans and reduce dependency.` -> suggested `1:Interestingly, the negative effects are not limited to heavy users but also affect moderate users.`; confidence 0.85; Option C lacks a clear antecedent for 'they' and introduces a solution too early; Option B logically extends the discussion of negative effects.

### seven_select-sp-kaoyan-hjvbv2
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of digital minimalism has gained considerable traction among professionals seeking to reclaim their time and mental space. (1) However, a growing body 
- Blank 4: current `5:This paradox suggests that the benefits of digital minimalism are not universal.` -> suggested `2:C. These findings challenge the assumption that less screen time always equals better mental health.`; confidence 0.85; Option F introduces 'paradox' without a clear paradox stated; Option C directly refers to 'these findings' from the preceding research, maintaining logical flow.

### seven_select-sp-kaoyan-hp2608
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of digital minimalism has gained considerable traction among professionals seeking to reclaim their time and mental clarity. The core premise is straig
- Blank 2: current `6:G. Without such casual digital interactions, people may find it harder to navigate complex social situations in real life.` -> suggested `1:B. Yet the very act of stepping back from digital noise can paradoxically create a new kind of anxiety.`; confidence 0.85; Option B directly contrasts the preceding sentence's 'inadvertently undermine' with a paradoxical effect, while G lacks a clear discourse link.

### seven_select-sp-kaoyan-hq5jpl
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of individuals have embraced digital minimalism, a lifestyle that advocates reducing screen time and curbing the use of social media. Proponents a
- Blank 4: current `5:Many people who adopt digital minimalism report feeling more focused and less overwhelmed.` -> suggested `1:Digital minimalism has been linked to lower rates of anxiety and depression in several studies.`; confidence 0.8; Option F breaks the argumentative flow by praising minimalism, while the passage is building a case for cognitive benefits of digital engagement; Option B is less disruptive but still not ideal; however, F is clearly unacceptable.

### seven_select-sp-kaoyan-jw1c6b
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones have become extensions of our hands, the boundary between work and personal life has grown increasingly porous. (1) This constant connectivity, while bo
- Blank 4: current `5:Without clear boundaries, employees find themselves responding to work emails late into the night.` -> suggested `6:These findings challenge the assumption that constant availability is synonymous with dedication.`; confidence 0.85; F is redundant and disrupts the logical flow from societal pressure to company policies; G provides a necessary transition.

### seven_select-sp-kaoyan-kaizsj
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where smartphones have become extensions of our hands, the boundary between being connected and being overwhelmed has grown increasingly thin. (1) Yet this constant conne
- Blank 5: current `6:Despite the benefits of instant communication, the drawbacks are becoming increasingly hard to ignore.` -> suggested `0:However, these measures often prove superficial, as users rarely alter their usage habits voluntarily.`; confidence 0.9; Blank 5 directly follows 'digital wellness features'; option A logically comments on those measures, while G is a general statement that fits better at the beginning.

### seven_select-sp-kaoyan-kotv42
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In modern consumer markets, the abundance of choices is often celebrated as a hallmark of freedom and prosperity. (1) This phenomenon has been extensively studied by psychologists 
- Blank 1: current `0:However, a growing body of research suggests that more choices do not always lead to better outcomes.` -> suggested `2:This phenomenon is often referred to as the 'tyranny of choice' or 'choice overload.'`; confidence 0.85; The passage opens by celebrating choice; the next sentence should define the phenomenon before discussing research. Option C directly names it, while A's 'However' is too abrupt and less coherent.
- Blank 2: current `2:This phenomenon is often referred to as the 'tyranny of choice' or 'choice overload.'` -> suggested `0:However, a growing body of research suggests that more choices do not always lead to better outcomes.`; confidence 0.8; After the jam example, the text explains the effect; option A logically introduces the research backing the phenomenon, while option C is a definition that fits better earlier.

### seven_select-sp-kaoyan-p1chbv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an era where digital connectivity is often hailed as the cornerstone of modern life, its pervasive influence has begun to exact subtle yet profound tolls on human cognition. (1)
- Blank 1: current `0:We often pride ourselves on being able to multitask efficiently, but research suggests this is largely a myth.` -> suggested `2:Digital devices have undeniably revolutionized the way we access information and communicate with others.`; confidence 0.85; Option C provides a natural positive lead-in before the contrast 'However', while option A's multitasking myth is less coherent with the opening.

### seven_select-sp-kaoyan-pegi9x
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, the concept of a digital detox has gained considerable traction among urban professionals who feel overwhelmed by constant connectivity. (1) Yet a growing body of 
- Blank 2: current `0:Many proponents argue that disconnecting from screens can restore mental clarity and improve sleep quality.` -> suggested `1:The researchers also noted that the effect was more pronounced among individuals who used social media primarily for social support.`; confidence 0.9; Blank 2 follows a specific study example; the current option A is a general proponent claim that breaks the flow. Option B directly continues the research findings, providing a logical detail about the study.

### seven_select-sp-kaoyan-po2n9o
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often mistaken for productivity, a growing number of professionals are embracing a counterintuitive practice: digital minimalism. (1) However, its c
- Blank 2: current `2:Instead, they replace mindless scrolling with purposeful reading or skill-building.` -> suggested `5:Yet the same engineer might spend hours on video-sharing platforms during weekends.`; confidence 0.9; The example of the engineer deactivating social media but using coding forums sets up a contrast; option F with 'Yet' provides that contrast, while option C about replacing mindless scrolling is a general statement that does not logically follow the specific example.

### seven_select-sp-kaoyan-raesvn
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of people have embraced digital minimalism, deliberately reducing their screen time and online presence. (1) However, this seemingly liberating pr
- Blank 1: current `0:A. Advocates argue that this shift improves mental health and deepens real-world relationships.` -> suggested `1:B. Yet the irony is that their absence from digital spaces can inadvertently create distance in those same relationships.`; confidence 0.9; The passage's 'However' signals a contrast, and B provides the ironic counterpoint, while A is a positive claim that does not fit the contrastive discourse marker.
- Blank 3: current `1:B. Yet the irony is that their absence from digital spaces can inadvertently create distance in those same relationships.` -> suggested `0:A. Advocates argue that this shift improves mental health and deepens real-world relationships.`; confidence 0.85; Blank 3 follows 'Moreover, the very act of disconnecting can be misinterpreted...' which is a negative consequence; A's positive advocates' view is out of place, and B is already used at blank 1.

### seven_select-sp-kaoyan-s8hr0v
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, digital minimalism has gained traction as a lifestyle philosophy that advocates reducing screen time and curbing online distractions. (1) Yet a growing body of res
- Blank 3: current `0:However, the effectiveness of such extreme measures remains hotly debated among psychologists and tech ethicists.` -> suggested `2:C. This suggests that moderate, conscious use of digital tools might be more sustainable than complete disconnection.`; confidence 0.9; Option A introduces a debate about 'extreme measures' not yet mentioned, breaking the logical flow from social isolation to the study result; Option C directly concludes from the study.
- Blank 5: current `3:Critics argue that digital minimalism is merely a privilege of the wealthy who can afford to disconnect.` -> suggested `4:E. Instead, researchers recommend gradual adjustments that align with one's personal and professional needs.`; confidence 0.85; Option D introduces an unrelated criticism, disrupting the flow from the mindful engagement example to the concluding sentence; Option E logically continues the recommendation and leads naturally to the final line.

### seven_select-sp-kaoyan-scg1rv
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where digital devices permeate every aspect of daily life, a growing number of individuals are embracing a counterintuitive movement known as digital minimalism. (1) Yet,
- Blank 1: current `0:Some proponents even schedule regular 'digital detox' weekends to fully immerse themselves in offline activities.` -> suggested `4:The key, according to its proponents, lies in shifting from passive consumption to active, purposeful use of digital tools.`; confidence 0.9; Option E introduces the core principle, which logically precedes specific practices like detox weekends; Option A is too specific and breaks the flow.
- Blank 2: current `4:The key, according to its proponents, lies in shifting from passive consumption to active, purposeful use of digital tools.` -> suggested `2:This selective engagement allows individuals to harness the benefits of technology while avoiding its pitfalls.`; confidence 0.85; Option C directly refers to 'selective engagement' and summarizes the benefit, fitting naturally after the sentence about deliberate curation; Option E is better placed earlier.
- Blank 3: current `2:This selective engagement allows individuals to harness the benefits of technology while avoiding its pitfalls.` -> suggested `0:Some proponents even schedule regular 'digital detox' weekends to fully immerse themselves in offline activities.`; confidence 0.9; Option A provides a concrete example that fits the exemplification pattern introduced by 'For instance'; Option C is too abstract and disrupts the sequence.

### seven_select-sp-kaoyan-uou6y5
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In an age where connectivity is often equated with productivity, a growing number of professionals are questioning the assumption that constant digital engagement is beneficial. (1
- Blank 2: current `3:The key is to distinguish between essential communication and mere digital clutter.` -> suggested `6:G. To counteract this, advocates suggest setting strict boundaries for technology use.`; confidence 0.85; The preceding sentence discusses the cognitive cost of multitasking; 'To counteract this' directly addresses that problem, while D is a general principle that fits better later.
- Blank 4: current `2:Some companies have already implemented no-email Fridays to encourage deeper interpersonal communication.` -> suggested `3:D. The key is to distinguish between essential communication and mere digital clutter.`; confidence 0.8; The sentence before blank 4 introduces scheduled focused work and disconnection; D's principle logically extends that idea, while C's example is better placed earlier.

### seven_select-sp-kaoyan-vzdtz2
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In recent years, a growing number of individuals have embraced digital minimalism, a lifestyle that deliberately reduces screen time to reclaim focus and mental well-being. (1) Yet
- Blank 3: current `2:C. Therefore, digital minimalism should be adopted gradually rather than as a sudden, drastic change.` -> suggested `3:D. Those who succeed in this practice typically replace digital consumption with offline activities such as reading, exercising, or face-to-face conversations.`; confidence 0.85; The current option C gives a general recommendation, but the passage after blank 3 discusses a paradox and the need for re-engineering networks; option D provides a contrastive example of successful practice that directly follows the software engineer example and leads into the paradox.

### seven_select-sp-kaoyan-xflnka
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: The academic publishing landscape has undergone a seismic shift over the past two decades, driven largely by digital technologies and changing expectations from both researchers an
- Blank 2: current `1:This has led to a significant increase in the number of open access journals and mandates from funding agencies.` -> suggested `6:Some fear that the rush to publish quickly may undermine the thoroughness of scientific validation.`; confidence 0.9; Option B describes a positive result, but the following 'However' signals a contrast; Option G introduces a concern that fits the contrast and leads into the controversy.
- Blank 3: current `3:These agreements aim to make research more accessible while maintaining financial sustainability for publishers.` -> suggested `2:Many researchers argue that the peer review process remains the cornerstone of scholarly integrity.`; confidence 0.85; Option D's 'these agreements' has no antecedent; the preceding sentence is about hybrid models. Option C provides a logical bridge between criticism of hybrid models and the subsequent discussion of university negotiations and preprint servers.

### seven_select-sp-kaoyan-y4tdot
- Type: seven_select; exam: KAOYAN; level: lv5
- Passage: In today’s hyperconnected world, the ability to juggle multiple tasks simultaneously is often celebrated as a hallmark of efficiency. (1) Yet a growing body of cognitive research s
- Blank 2: current `1:B. However, this apparent efficiency comes at a hidden price that most users fail to recognize.` -> suggested `2:C. Consequently, even brief interruptions can extend the total time needed to complete a complex project by up to 40 percent.`; confidence 0.85; Option B repeats the idea of hidden cost already introduced; Option C provides a concrete consequence that logically follows the preceding claim about cognitive costs.

### seven_select-sp-中考-11frk59
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My parents and I planned to give her a surprise. (1) We decided to make a photo album for her. It was not expensive, but it was full
- Blank 5: current `4:E. I usually go to the park on weekends.` -> suggested `-1:`; confidence 1; The sentence is irrelevant to the narrative about the grandmother's birthday gift; it breaks coherence.

### seven_select-sp-中考-13b9r7y
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Mother’s Day. Tom wanted to give his mom a special gift. (1) He went to a flower shop and saw many beautiful flowers. (2) The shopkeeper told him that roses were expensive. 
- Blank 5: current `2:Tom bought a rose for his mother at last.` -> suggested `-1:`; confidence 0.95; Buying a rose contradicts the story; no suitable option in bank, so blank should be removed or re-evaluated.

### seven_select-sp-中考-13gqloh
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my parents and I went to my grandparents’ house in the countryside. The weather was fine and the air smelled fresh. (1) My grandpa smiled and said, “Let me show you so
- Blank 5: current `1:B. Grandma came out and gave me a hug.` -> suggested `3:D. A week later, the bud opened into a beautiful red flower.`; confidence 0.9; The narrative flows from daily care to the bloom and the lesson; Grandma's hug is irrelevant and breaks the sequence.

### seven_select-sp-中考-13hs8h2
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was Mother’s Day. Tom and his sister Lily wanted to do something special for their mom. (1) They decided to make breakfast and a card. Tom was good at cooking eggs, and
- Blank 2: current `3:D. First, they got up early and started to work.` -> suggested `4:E. Lily carefully placed the card beside the plate.`; confidence 0.9; The current key 'First, they got up early' is out of sequence after making breakfast and card; placing the card beside the plate is a logical next step.
- Blank 5: current `4:E. Lily carefully placed the card beside the plate.` -> suggested `3:D. First, they got up early and started to work.`; confidence 0.9; The current key 'Lily carefully placed the card beside the plate' is a detail from earlier in the story, not a closing after enjoying the morning; 'First, they got up early' is a logical opening for the whole story.

### seven_select-sp-中考-149y4cm
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my 15th birthday. I thought I would get a new phone or a cool pair of sneakers. (1) My parents smiled and handed me a small box. Inside was not a phone or sneakers,
- Blank 4: current `6:They taught me a lesson I will never forget.` -> suggested `3:They grew bigger and bigger day by day.`; confidence 0.85; After seeing sprouts, the logical next step is growth, not a concluding lesson; the lesson belongs at the end.
- Blank 5: current `0:I thanked them and said it was the best birthday ever.` -> suggested `6:They taught me a lesson I will never forget.`; confidence 0.9; The final sentence should reflect the lesson learned, not a premature thank-you; the suggested option matches the reflective tone.

### seven_select-sp-中考-154info
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was Mother’s Day. Tom wanted to give his mother a special gift, but he had no money. (1) He looked around the house and found some colored paper, glue and old buttons. 
- Blank 4: current `0:His mother put the card on the table.` -> suggested `6:His mother said it was the best gift she had ever received.`; confidence 0.9; After the hug, mother's praise fits naturally; putting the card on the table is anticlimactic and disrupts the emotional sequence.
- Blank 5: current `6:His mother said it was the best gift she had ever received.` -> suggested `0:His mother put the card on the table.`; confidence 0.8; With G moved to blank 4, blank 5 needs a concluding action; A fits as a natural follow-up to the praise, and the final sentence about handmade gifts then makes sense as a general remark.

### seven_select-sp-中考-155g17s
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday. I woke up early but found the house very quiet. (1) I walked into the living room and saw a big box on the table. (2) I opened it carefully and 
- Blank 4: current `4:E. From that day on, I started to learn to play the guitar.` -> suggested `2:C. They told me it was a gift they chose together.`; confidence 0.9; After hugging parents, the natural next step is parents explaining the gift, not starting to learn immediately.
- Blank 5: current `5:F. My friends came to my party in the afternoon.` -> suggested `4:E. From that day on, I started to learn to play the guitar.`; confidence 0.95; The passage ends with practicing and playing songs, which logically follows starting to learn; the party sentence breaks the timeline.

### seven_select-sp-中考-15ratwu
- Type: seven_select; exam: 中考; level: lv1
- Passage: Some students think that studying in a quiet room is the best way to learn. However, others believe that learning with friends can be more effective. (1) For example, when you expl
- Blank 2: current `2:It is important to choose the right study method for different subjects.` -> suggested `4:Both ways have their own strengths and weaknesses.`; confidence 0.9; The current option about choosing methods for subjects is too general and breaks the contrast between studying alone and group study; the suggested option logically bridges the advantages of alone and the downside of group study.
- Blank 5: current `4:Both ways have their own strengths and weaknesses.` -> suggested `2:It is important to choose the right study method for different subjects.`; confidence 0.85; The passage concludes with advice on mixing methods for different subjects, so the suggested option fits the flow, while the current option is redundant and less specific.

### seven_select-sp-中考-162fz0t
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my mother asked me to help her in the garden. She wanted to plant some flowers. (1) I was not very happy because I wanted to play computer games. But I still went outs
- Blank 4: current `3:It flew into the sky and I smiled happily.` -> suggested `6:The bird looked at us and seemed to say thanks.`; confidence 0.85; The bird becomes stronger and moves wings, then they decide to let it go. A gratitude look fits before release, while flying away is the final action.
- Blank 5: current `5:Finally, my mother agreed to let me play games.` -> suggested `3:It flew into the sky and I smiled happily.`; confidence 0.9; The passage ends with 'meaningful day', which naturally follows the bird's release and happiness, not a return to gaming.

### seven_select-sp-中考-16ffiiq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom and his dad went to the city park. They wanted to fly a kite because it was a sunny day with a gentle wind. (1) So they walked to the open grass field near the l
- Blank 2: current `6:His dad climbed up the tree carefully and got the kite down.` -> suggested `3:His dad said, “Don’t worry, I’ll get it.”`; confidence 0.95; The dad's action of climbing should follow his offer to help; placing the action before the offer breaks logical sequence.
- Blank 3: current `3:His dad said, “Don’t worry, I’ll get it.”` -> suggested `6:His dad climbed up the tree carefully and got the kite down.`; confidence 0.95; After the dad says he'll get it, the next logical step is the actual climbing and retrieval, not another reassurance.

### seven_select-sp-中考-16pand4
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousins and I wanted to give her a special gift. (1) We thought about buying a cake or a dress, but they were too common. (2) She
- Blank 3: current `1:We went to the store and chose some beautiful roses.` -> suggested `2:C. Then we planted the seeds together in the garden.`; confidence 0.95; After buying seeds and a watering can, planting is the logical next step; buying roses is out of place.
- Blank 4: current `2:Then we planted the seeds together in the garden.` -> suggested `1:B. We went to the store and chose some beautiful roses.`; confidence 0.9; The box surprises her; roses in a box fit better than planted seeds, which would already be in the ground.

### seven_select-sp-中考-16zizyr
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often feel tired during the day? Maybe you are not getting enough good sleep. (1) Here are some simple tips to help you sleep better. First, keep a regular sleep schedule. G
- Blank 1: current `0:Good sleep is important for our health.` -> suggested `2:Many people have trouble falling asleep at night.`; confidence 0.9; The passage opens with a problem (tiredness) and then introduces tips; option C directly addresses the problem and leads naturally into the tips, while option A is a generic statement that disrupts the problem-solution flow.
- Blank 3: current `4:These things can make it hard for your body to relax.` -> suggested `6:They can make it harder to fall asleep.`; confidence 0.85; The blank follows 'Keep it dark, quiet, and cool.' Option G ('They can make it harder to fall asleep') logically refers to the bedroom conditions (dark, quiet, cool) and explains their benefit, while option E ('These things...') is vague and does not clearly connect to the preceding items.
- Blank 5: current `5:Exercising during the day can also improve your sleep.` -> suggested `6:They can make it harder to fall asleep.`; confidence 0.9; The blank follows 'don’t eat heavy meals or drink coffee too late.' Option G directly explains why these are bad (they make it harder to fall asleep), maintaining local coherence, while option F introduces an unrelated tip about exercise, breaking the flow.

### seven_select-sp-中考-1731qlq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I took out some colored paper and drew a b
- Blank 5: current `1:B. She asked me where I bought it.` -> suggested `-1:`; confidence 0.9; Mother knows card is handmade; asking where bought contradicts context. No suitable option fits.

### seven_select-sp-中考-19bawy9
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousin and I wanted to give her a special gift. (1) We decided to make a photo album by ourselves. First, we collected all the ol
- Blank 2: current `2:We found many funny pictures of her when she was young.` -> suggested `0:We spent the whole afternoon working on it.`; confidence 0.9; The current sentence (C) about finding funny pictures logically belongs after collecting photos (blank 1) and before buying materials (blank 2). Placing it after buying materials disrupts the chronological order. The suggested sentence (A) fits better after describing all the steps.

### seven_select-sp-中考-19idol2
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom is a middle school student. He is very busy with his studies every day. (1) He often forgets to do his homework or loses his school things. Last week, his father bought him a s
- Blank 2: current `2:It also helps him with his studies.` -> suggested `3:Then it tells him what to take for school.`; confidence 0.9; The morning routine sequence (wake up, tell weather) logically continues with telling what to take for school; option C is too general and disrupts the temporal flow.
- Blank 3: current `3:Then it tells him what to take for school.` -> suggested `2:It also helps him with his studies.`; confidence 0.85; After the morning routine, the passage shifts to after-school help; option C serves as a general transition to that, while D is misplaced as it belongs to the morning sequence.

### seven_select-sp-中考-19m2160
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother's birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I took out a piece of white paper and some
- Blank 5: current `1:My father helped me finish the card.` -> suggested `5:She smiled and thanked me again.`; confidence 0.95; The story ends with the mother's reaction and the author's feeling; inserting father's help after resolution breaks coherence. Option F naturally follows the mother's hug and words.

### seven_select-sp-中考-1b3uam0
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my birthday. I didn’t expect anything special because my parents were busy with work. (1) When I opened the door, I saw a big box on the table. (2) I was so curio
- Blank 1: current `1:B. But when I came home from school, I noticed something different in the living room.` -> suggested `0:A. However, they gave me a big surprise.`; confidence 0.9; Option A provides the needed contrast after 'I didn’t expect anything special', while B introduces a temporal sequence that doesn't logically follow.
- Blank 5: current `0:A. However, they gave me a big surprise.` -> suggested `3:D. From that day on, the dog became my best friend.`; confidence 0.95; Option D naturally leads into the daily routine in the next sentence; A is a surprise statement that belongs earlier.

### seven_select-sp-中考-1bhzsgy
- Type: seven_select; exam: 中考; level: lv1
- Passage: First impressions are very important. They can influence how people think of you. (1) Here are some simple tips to help you. First, smile when you meet someone. (2) It makes you lo
- Blank 3: current `1:You should avoid looking at the ground.` -> suggested `6:G. Nodding your head can also show you are listening.`; confidence 0.85; Option B about avoiding looking at ground does not logically follow 'keep eye contact' and does not lead into 'This shows you are interested'. Option G directly supports the listening context and provides a clear antecedent for 'This'.
- Blank 4: current `6:Nodding your head can also show you are listening.` -> suggested `1:B. You should avoid looking at the ground.`; confidence 0.8; Option G about nodding is misplaced here; it fits better at blank 3. Option B, while not perfect, is the only remaining option that can loosely relate to listening (avoiding distraction) and is less disruptive than leaving G here.

### seven_select-sp-中考-1cyitew
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. He wanted to plant some flowers there. (1) He put on his gloves and took a small shovel. The sun was warm and the birds
- Blank 2: current `2:He found some coins and a key inside.` -> suggested `4:Tom pulled it out and found it was not a stone.`; confidence 0.95; The shovel hits something hard; the next logical step is to pull it out and discover it's not a stone, not to immediately find coins inside.
- Blank 3: current `4:Tom pulled it out and found it was not a stone.` -> suggested `2:He found some coins and a key inside.`; confidence 0.9; After opening the box, the natural next step is to see what's inside, i.e., coins and a key, before reading the letter.

### seven_select-sp-中考-1dsz6h0
- Type: seven_select; exam: 中考; level: lv1
- Passage: When you meet someone for the first time, you want to make a good impression. (1) Here are some tips to help you. First, smile warmly. A smile shows that you are friendly and easy 
- Blank 5: current `6:You can practice in front of a mirror every day.` -> suggested `3:People like those who are honest and natural.`; confidence 0.95; The current key suggests practicing in front of a mirror, which contradicts 'be yourself'; the suggested option directly supports the advice.

### seven_select-sp-中考-1e6e3mj
- Type: seven_select; exam: 中考; level: lv1
- Passage: Everyone wants to be happy, but not everyone knows how to find happiness. (1) Some people think money can bring happiness, but they are wrong. In fact, happiness comes from small t
- Blank 3: current `5:Just take a walk in the park and feel the fresh air.` -> suggested `2:A kind word from a friend can also make your day.`; confidence 0.85; The passage lists small joys like reading and music; a kind word is a parallel small joy, while a walk is more active and less fitting.
- Blank 4: current `4:Instead, they are always running after money and success.` -> suggested `5:Just take a walk in the park and feel the fresh air.`; confidence 0.8; After 'too busy to notice simple pleasures', a concrete suggestion to slow down (take a walk) directly leads to 'enjoy the moment', whereas 'running after money' is a general statement.

### seven_select-sp-中考-1ek3og1
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom is a middle school student. He loves science and often reads books about robots. Last month, his school held a science fair. (1) He wanted to make a robot that could help with 
- Blank 2: current `6:G. The teacher gave him some advice on the design.` -> suggested `4:E. He wanted to make a robot that could talk.`; confidence 0.9; The passage already states he wanted a robot for housework; adding a desire to talk after showing the picture and receiving praise breaks the logical flow. Teacher's advice fits better before collecting materials.

### seven_select-sp-中考-1ffzzz9
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Saturday morning. Tom and his sister Lily wanted to do something special for their mother. (1) They decided to make breakfast for her. Tom got the bread and eggs from the fr
- Blank 2: current `2:C. Then they made some sandwiches and poured milk.` -> suggested `4:E. After that, they cleaned the kitchen together.`; confidence 0.9; The passage describes making breakfast with bread, eggs, strawberries, and milk, not sandwiches. Cleaning the kitchen after cooking fits the sequence better.
- Blank 3: current `4:E. After that, they cleaned the kitchen together.` -> suggested `2:C. Then they made some sandwiches and poured milk.`; confidence 0.9; After preparing food, the next logical step is to assemble the meal (sandwiches and milk) before serving, not cleaning.
- Blank 4: current `5:F. Their mother was still sleeping in bed.` -> suggested `6:G. She told them to go back to sleep.`; confidence 0.95; The mother is surprised and happy, not still sleeping. 'She told them to go back to sleep' contradicts the positive reaction.
- Blank 5: current `1:B. Tom made a sandwich for himself.` -> suggested `0:A. They wanted to give her a nice surprise.`; confidence 0.85; The passage ends with a promise to help more; 'Tom made a sandwich for himself' is irrelevant and self-centered. Option A fits the theme of surprising mother but is already used in blank 1; a better alternative is needed, but among remaining options, none fit well. However, the current choice is clearly wrong.

### seven_select-sp-中考-1fj1ago
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Saturday morning. Tom and his sister Lily wanted to do something special for their mother. (1) They decided to make breakfast for her. Tom got the bread and eggs, while Lily
- Blank 5: current `2:C. Mom was still sleeping in her bedroom.` -> suggested `-1:`; confidence 0.95; Mom is already awake, surprised, and hugging them; saying she was still sleeping contradicts the sequence.

### seven_select-sp-中考-1gdggjo
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school held a sports day. I took part in the relay race with my classmates. (1) We practiced every day after school. At first, we often dropped the baton. (2) Our c
- Blank 5: current `0:A. We felt very sad and wanted to give up.` -> suggested `6:G. I still remember the smile on my teammates' faces.`; confidence 0.9; Option A contradicts the positive outcome of winning second place and the lesson about teamwork; Option G provides a fitting positive reflective ending.

### seven_select-sp-中考-1i1cc09
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother's birthday. My cousin and I decided to make a special gift for her. (1) We thought she would love a homemade card. First, we bought some colorful pap
- Blank 3: current `1:It took us about two hours to finish the card.` -> suggested `4:E. Finally, we put the card into an envelope.`; confidence 0.9; The logical sequence of making a card ends with putting it into an envelope before presenting; B (time taken) is out of place here.

### seven_select-sp-中考-1i51coh
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I didn’t have much money. (1) I decided to make a card by myself. I got some colored paper, scisso
- Blank 2: current `2:I first cut the paper into the shape of a card.` -> suggested `1:Then I began to make the card carefully.`; confidence 0.9; The current key 'I first cut the paper...' is a specific step that should follow the general statement of beginning to make the card, not precede it. The suggested option provides a logical sequence.

### seven_select-sp-中考-1i8lu5u
- Type: seven_select; exam: 中考; level: lv1
- Passage: A smile is a small thing, but it can make a big difference. (1) When you smile at someone, it shows that you are friendly and kind. (2) For example, if you smile at a new classmate
- Blank 4: current `6:In fact, smiling uses fewer muscles than frowning.` -> suggested `5:Also, smiling is contagious and can spread joy.`; confidence 0.9; The muscle fact is irrelevant; the contagious joy idea logically leads to the advice to smile more when sad.
- Blank 5: current `4:Sometimes you may find it hard to smile.` -> suggested `6:In fact, smiling uses fewer muscles than frowning.`; confidence 0.9; The muscle fact provides a light supporting detail before the concluding gift metaphor; 'hard to smile' contradicts the encouraging tone.

### seven_select-sp-中考-1ick2pt
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school organized a trip to the science museum. (1) We saw many interesting exhibits, such as a robot that could play chess and a model of the solar system. (2) The 
- Blank 2: current `5:F. We also watched a short film about space travel.` -> suggested `1:B. I was most surprised by the robot.`; confidence 0.9; The robot is the topic of the preceding and following sentences; inserting a film about space travel breaks coherence.

### seven_select-sp-中考-1j0linp
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Saturday morning. Tom and his sister Lily wanted to do something special for their mother. (1) They decided to make breakfast for her. Tom got the bread and eggs ready, whil
- Blank 3: current `1:B. Lily quickly picked up the knife and washed it.` -> suggested `6:G. Lily felt very sorry and started to cry.`; confidence 0.9; After dropping the knife, an emotional reaction is more natural than immediately washing it, which would be unsafe and premature.
- Blank 5: current `2:C. Their mother was sleeping in her bedroom.` -> suggested `3:D. She smiled and hugged them.`; confidence 0.95; Mother is already downstairs; 'sleeping' contradicts the sequence. 'Smiled and hugged' fits the positive resolution.

### seven_select-sp-中考-1j6p178
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn't expect any big celebration because my parents were busy with work. (1) When I opened the door, I saw a small box on the table. It was wrapped 
- Blank 1: current `1:B. To my surprise, there was a note from my mom saying she loved me.` -> suggested `0:A. My parents forgot my birthday completely.`; confidence 0.9; Option B introduces a note before the box is opened, which is premature; Option A provides a logical contrast to the surprise gift.
- Blank 3: current `3:D. We had a wonderful time together.` -> suggested `1:B. To my surprise, there was a note from my mom saying she loved me.`; confidence 0.95; After unwrapping the notebook and pen, finding a note inside explains the warm feeling; 'We had a wonderful time together' refers to Tom's visit, which hasn't occurred yet.
- Blank 4: current `6:G. That evening, I wrote down all the happy moments in the notebook.` -> suggested `3:D. We had a wonderful time together.`; confidence 0.9; After Tom comes over with cake and they sing and talk, describing the time together is natural; writing in the notebook is more appropriate at the end of the day.
- Blank 5: current `4:E. I put the notebook on the shelf and never used it.` -> suggested `6:G. That evening, I wrote down all the happy moments in the notebook.`; confidence 0.95; Writing down happy moments leads directly to the reflection that love and friendship are the best gifts; putting it away unused contradicts the positive tone.

### seven_select-sp-中考-1kdn02o
- Type: seven_select; exam: 中考; level: lv1
- Passage: When you meet someone for the first time, you want to make a good impression. (1) Here are some simple tips to help you. First, always smile. A smile shows that you are friendly an
- Blank 4: current `5:This helps you know them better.` -> suggested `2:This shows respect and helps you understand better.`; confidence 0.9; The blank directly follows 'Don't interrupt when the other person is speaking.' The suggested option about respect and understanding is a natural and coherent continuation, while the current option about knowing them better is less directly connected.
- Blank 3: current `2:This shows respect and helps you understand better.` -> suggested `5:This helps you know them better.`; confidence 0.85; Blank 3 follows 'look the person in the eye' and 'It shows you are interested...' The suggested option about knowing them better fits the context of eye contact aiding understanding, while the current option about respect is more appropriate for the listening tip.

### seven_select-sp-中考-1korklr
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, I helped my grandpa in his garden. He asked me to water the flowers and pull out the weeds. (1) I was surprised to find a small, green box under a big sunflower. I o
- Blank 3: current `3:Inside the box, there was a beautiful red flower.` -> suggested `1:B. I took out a small toy car and a photo of my grandpa and me.`; confidence 0.9; After opening the box, the next logical step is to describe what was taken out; the note mentions 'grandson' and a photo, not a flower.

### seven_select-sp-中考-1nllsyr
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, I helped my grandpa in his garden. He asked me to water the flowers and pull out some weeds. (1) Suddenly, I saw something shiny under a big sunflower. (2) I called 
- Blank 2: current `4:Then I noticed a small, round object near the roots.` -> suggested `0:I was curious and bent down to look carefully.`; confidence 0.9; The passage already mentions seeing something shiny at blank 1; noticing another object at blank 2 is redundant and breaks the logical sequence.
- Blank 3: current `3:I put it into my pocket.` -> suggested `2:He said it was probably from the 19th century.`; confidence 0.85; After digging out the coin, the natural next step is to examine it or get an opinion, not immediately pocket it.
- Blank 4: current `2:He said it was probably from the 19th century.` -> suggested `5:We washed it with water to see it clearly.`; confidence 0.8; After grandpa's comment about the date, cleaning the coin to see it better is logical before deciding to take it to a museum.

### seven_select-sp-中考-1nmgfd9
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) So I decided to make a card by myself. I took out a piece of paper and some co
- Blank 1: current `2:C. I wanted to buy a gift from the store.` -> suggested `-1:`; confidence 0.95; The passage explicitly says 'I had no money', so wanting to buy a gift contradicts the context. No option fits; the blank should be omitted.

### seven_select-sp-中考-1nsyioq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom was a quiet boy who loved drawing. He often sat in the corner of the classroom, drawing pictures of trees and birds. (1) He wanted to give his mother something special for her 
- Blank 5: current `4:E. She took the drawing and looked at it carefully.` -> suggested `2:C. Tom felt very happy.`; confidence 0.9; After the mother's reaction, 'Tom felt very happy' provides a logical emotional response before the concluding lesson, while the current key is redundant with blank 4.

### seven_select-sp-中考-1oxoti3
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, I helped my grandma in her garden. She showed me how to water the flowers and pull out the weeds. (1) I was surprised and asked where it came from. Grandma smiled and 
- Blank 3: current `2:I thought it was a good idea.` -> suggested `1:I didn’t really understand what she meant.`; confidence 0.85; After grandma's explanation, confusion is logical before deciding to care for the plant; 'I thought it was a good idea' is too vague and breaks coherence.
- Blank 4: current `3:A few weeks later, the tomato turned red.` -> suggested `4:It tasted so sweet!`; confidence 0.9; After picking and making salad, tasting is the natural next step; 'turned red' should precede picking.
- Blank 5: current `4:It tasted so sweet!` -> suggested `3:A few weeks later, the tomato turned red.`; confidence 0.9; The final blank before the conclusion needs the ripening event to lead to picking and salad; 'tasted sweet' belongs earlier.

### seven_select-sp-中考-1pb0fe2
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special. (1) I decided to make a card by myself. First, I took out a piece of red paper. (2) Then I drew some f
- Blank 4: current `2:C. She smiled and gave me a big hug.` -> suggested `5:F. I hid it under my bed until dinner.`; confidence 0.95; C (reaction) before receiving is illogical; F fits the timeline perfectly.
- Blank 5: current `4:E. I was very happy to see her smile.` -> suggested `2:C. She smiled and gave me a big hug.`; confidence 0.9; E (narrator's happiness) before her reaction is out of order; C is the natural response after her statement.

### seven_select-sp-中考-1pp6ifk
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to plant some flowers in his backyard. He took out a small shovel and began to dig. (1) He carefully opened it and found an old metal box inside. (2) The
- Blank 4: current `2:He found a small key inside the box.` -> suggested `0:Suddenly, his shovel hit something hard.`; confidence 0.95; The box is already open and contents described; finding a key inside now is illogical. No option fits perfectly, but the current key is clearly wrong.

### seven_select-sp-中考-1ps8vm1
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often have trouble sleeping at night? You are not alone. Many teenagers find it hard to fall asleep or stay asleep. (1) For example, using phones or playing games before bed
- Blank 2: current `5:Exercise during the day can improve your sleep.` -> suggested `1:Here are some tips to help you sleep well.`; confidence 0.9; Blank 2 is the start of the advice section; a general introductory sentence fits better than a specific tip.

### seven_select-sp-中考-1qbl9sv
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school held a boat race. Each class needed to form a team of eight students. (1) At first, we didn't know how to row together. Some of us rowed too fast, while othe
- Blank 2: current `1:B. We started to understand how to work together.` -> suggested `0:A. Our coach, Mr. Li, came over to help us.`; confidence 0.95; The pronoun 'He' in the following sentence requires an antecedent; only option A provides Mr. Li.
- Blank 3: current `2:C. Our boat shot across the water like an arrow.` -> suggested `1:B. We started to understand how to work together.`; confidence 0.9; Option C describes race-day action, but blank 3 is set during practice; option B logically follows practice and leads to race day.
- Blank 4: current `3:D. This experience taught us a valuable lesson.` -> suggested `2:C. Our boat shot across the water like an arrow.`; confidence 0.9; Blank 4 describes the race moment; option C fits the action, while D is a concluding reflection that belongs later.
- Blank 5: current `4:E. Some of us wanted to give up at first.` -> suggested `3:D. This experience taught us a valuable lesson.`; confidence 0.95; Blank 5 is the final sentence; option D provides a fitting conclusion, whereas E is an early-stage sentiment out of place at the end.

### seven_select-sp-中考-1qejlud
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. He put on his gloves and took a small shovel. (1) He dug carefully and found a small, dirty box. (2) Tom’s heart beat f
- Blank 4: current `1:He put the coin in his pocket and went back to work.` -> suggested `3:His mother was watering the flowers in the front yard.`; confidence 0.9; Tom runs to show his mother, so the next sentence should describe her location or action, not Tom putting the coin away and returning to work.
- Blank 5: current `6:She told him to keep digging and see what else he could find.` -> suggested `1:He put the coin in his pocket and went back to work.`; confidence 0.85; After mother's response, Tom's decision to keep the coin in his treasure box is a natural conclusion; 'She told him to keep digging' contradicts the story's finality.

### seven_select-sp-中考-1qh06tn
- Type: seven_select; exam: 中考; level: lv1
- Passage: Everyone feels sad or upset sometimes. (1) In fact, there are some easy ways to help you feel better. First, you can talk to your parents or friends. (2) When you share your feelin
- Blank 1: current `3:You should study harder.` -> suggested `0:Sometimes we don't know what to do.`; confidence 0.95; Current key 'You should study harder' is irrelevant to feeling sad and seeking help; suggested option logically follows the opening.
- Blank 2: current `0:Sometimes we don't know what to do.` -> suggested `1:They are happy to listen.`; confidence 0.95; After 'talk to your parents or friends', the response should be about their reaction; current key is misplaced.
- Blank 3: current `1:They are happy to listen.` -> suggested `2:Exercise helps you relax.`; confidence 0.95; Blank follows 'doing exercise is a great idea'; current key is irrelevant, suggested option fits naturally.

### seven_select-sp-中考-1rjs5y2
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I didn’t have much money. (1) I decided to make a card by myself. I got some colored paper, glue, 
- Blank 3: current `0:After finishing the card, I cleaned up the table.` -> suggested `4:I wrote a short poem on the back of the card.`; confidence 0.9; Cleaning up after finishing the card breaks the logical sequence of making, decorating, and enclosing the card; writing a poem fits before putting it in the envelope.
- Blank 5: current `4:I wrote a short poem on the back of the card.` -> suggested `0:After finishing the card, I cleaned up the table.`; confidence 0.85; The poem-writing is already used at blank 3; placing it after the emotional climax is illogical. Cleaning up the table is a natural concluding action after the gift is given.

### seven_select-sp-中考-1shi55c
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom was very excited because his 12th birthday was coming. He hoped to get a new bike as a gift. (1) He thought about the cool bike in the shop window every day. On the morning of 
- Blank 2: current `3:His parents had already prepared a birthday party for him.` -> suggested `1:He wanted to ride it in the park with his friends.`; confidence 0.9; The party sentence is irrelevant after running downstairs; wanting to ride the bike fits the context of his excitement and the upcoming gift.
- Blank 4: current `2:The story was about a little boy who loved riding.` -> suggested `5:After the story, Tom understood something important.`; confidence 0.95; The story content is about the father fixing the bike, not a little boy; the blank needs a transition to the father's explanation, not the story's content.
- Blank 5: current `5:After the story, Tom understood something important.` -> suggested `2:The story was about a little boy who loved riding.`; confidence 0.85; The current key places understanding before the father's explanation; the story content should come earlier, but the sequence is disrupted. The suggested option fits better after the father's story is told.

### seven_select-sp-中考-1tn1h3a
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. He put on his gloves and started to pull out the weeds. (1) Suddenly, he saw something shiny under a big stone. He move
- Blank 3: current `2:C. Tom's mother was watering flowers in the garden.` -> suggested `1:B. His mother was surprised to see the box.`; confidence 0.9; Tom runs to get his mother after finding the box; her reaction to the box is the logical next step, not an unrelated watering activity.

### seven_select-sp-中考-1uvwtcj
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, I went to the city library with my friend Tom. (1) We saw an old woman standing near the door. She looked worried because she couldn't find her reading glasses. (2) To
- Blank 5: current `5:She said she would buy a new pair tomorrow.` -> suggested `-1:`; confidence 0.9; The glasses were found, so buying a new pair is incoherent; no option fits, but the current key is clearly wrong.

### seven_select-sp-中考-1v71g1d
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousin and I decided to make a special gift for her. (1) We thought a handmade card would be more meaningful than a store-bought 
- Blank 4: current `5:Her eyes lit up when she saw the card.` -> suggested `2:C. She hugged us and thanked us again and again.`; confidence 0.9; After putting the card on the shelf, a reaction of hugging and thanking fits logically, while 'Her eyes lit up' should occur earlier when she first saw the card.

### seven_select-sp-中考-1vq5ct1
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my birthday. I didn’t expect anything special because my parents were busy with work. (1) When I opened the door, I saw a big box on the table. (2) I was very cur
- Blank 1: current `2:C. Suddenly, the doorbell rang and a delivery man came.` -> suggested `0:A. When I got home, my parents were still at work.`; confidence 0.9; The passage states 'When I opened the door, I saw a big box on the table.' This implies the speaker just arrived home, not that a delivery man rang. Option A logically leads to opening the door and seeing the box.
- Blank 5: current `0:A. When I got home, my parents were still at work.` -> suggested `1:B. I felt so happy and thanked them with a big hug.`; confidence 0.9; Blank 5 is near the end, after the mother's explanation. The natural reaction is to feel happy and thank them, not to mention coming home again. Option B fits the emotional closure.

### seven_select-sp-中考-1vswyvn
- Type: seven_select; exam: 中考; level: lv1
- Passage: Hamsters are popular pets for many families. They are small, cute and easy to take care of. (1) A happy hamster needs a comfortable home. First, you should prepare a cage that is b
- Blank 3: current `5:F. A clean environment is necessary for their health.` -> suggested `0:A. However, hamsters can be very noisy at night.`; confidence 0.85; Option F about cleanliness is irrelevant to the exercise context; no perfect fit exists, but A is the least disruptive among remaining options.
- Blank 4: current `6:G. Playing with them every day is also a good idea.` -> suggested `4:E. Giving them too much fruit can cause health problems.`; confidence 0.95; Option G about playing is off-topic for the food paragraph; E directly relates to food and health, fitting the context.
- Blank 5: current `3:D. Some hamsters like to sleep during the day.` -> suggested `2:C. Make sure to change the bedding at least once a week.`; confidence 0.95; Option D about sleeping is irrelevant to cleaning; C provides a specific cleaning tip that fits perfectly after 'clean the cage regularly'.

### seven_select-sp-中考-1wggqwc
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I didn’t have much money. (1) I decided to make a card by myself. First, I found a piece of red pa
- Blank 5: current `2:C. I asked my father for help.` -> suggested `3:D. I was worried she might not like it.`; confidence 0.7; Current option C ('I asked my father for help') is irrelevant after the positive reaction. Suggested D is not ideal but is less disruptive and could express a prior worry now resolved.

### seven_select-sp-中考-1y6up9
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I woke up early and found a small box on my desk. (1) I opened it carefully and saw a blue watch inside. It was not new, but it looked clean and specia
- Blank 2: current `4:I had no idea what it was.` -> suggested `1:I recognized it at once.`; confidence 0.95; The following sentence 'I remembered...' shows recognition, contradicting 'had no idea'.
- Blank 5: current `1:I recognized it at once.` -> suggested `5:I was so moved that I couldn’t speak.`; confidence 0.9; After learning father stayed up to repair the watch, an emotional reaction fits better than recognition which already occurred earlier.

### seven_select-sp-中考-1yqx5ig
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday. I thought I would get a new phone or a cool bike. (1) When I opened the box, I saw an old photo album. It was full of pictures of my parents and
- Blank 5: current `3:D. Then I got a new phone from my uncle.` -> suggested `4:E. This album is more valuable to me than any phone.`; confidence 0.95; The passage ends with a reflection on love and value; D introduces an unrelated new phone, breaking coherence and theme.

### seven_select-sp-中考-2uvbd5
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. (1) He started to pull out the weeds carefully. Suddenly, he found something hard under the soil. (2) It was a small, r
- Blank 2: current `2:C. His mother was surprised and happy.` -> suggested `1:B. He dug it out with his hands.`; confidence 0.95; After finding a hard object, the next logical step is to dig it out, not for the mother to react before the box is even revealed.
- Blank 3: current `3:D. It was written in 1920.` -> suggested `2:C. His mother was surprised and happy.`; confidence 0.9; After opening the box and seeing coins and a letter, the mother's reaction fits better than dating the letter before it is read.
- Blank 4: current `4:E. They decided to dig more and finally found a bag of silver coins.` -> suggested `3:D. It was written in 1920.`; confidence 0.9; The letter's content is described next; the dating of the letter naturally follows the mention of the letter, not the final discovery.
- Blank 5: current `0:A. His mother asked him to water the flowers first.` -> suggested `4:E. They decided to dig more and finally found a bag of silver coins.`; confidence 0.95; The story concludes with the treasure discovery; watering flowers is irrelevant and breaks the narrative flow.

### seven_select-sp-中考-2z8b0v
- Type: seven_select; exam: 中考; level: lv1
- Passage: Summer is a great time for fun and outdoor activities. (1) Here are some simple tips to help you stay healthy during the hot days. First, drink plenty of water. (2) If you feel thi
- Blank 2: current `3:D. When you go out, always remember to use sunscreen.` -> suggested `0:A. Your body loses water quickly when you sweat.`; confidence 0.95; The context is about drinking water and thirst; the sentence should explain why water is needed, not sunscreen.

### seven_select-sp-中考-3gg88c
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special. (1) I decided to make a card by myself. I got some paper, colored pencils and glue. (2) I drew a big h
- Blank 4: current `5:Finally, I gave the card to her after dinner.` -> suggested `3:D. She put the card on the table and said nothing.`; confidence 0.9; The passage already describes the mother seeing the card and hugging the child before blank 4, so 'Finally, I gave the card to her after dinner' is out of sequence. Option D provides a logical reaction before she speaks in the next sentence.

### seven_select-sp-中考-45s7jy
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. (1) He started to pull out the weeds carefully. Suddenly, he found something hard under the soil. (2) Tom was curious a
- Blank 1: current `0:The garden was full of beautiful flowers.` -> suggested `1:He dug a hole to plant a new tree.`; confidence 0.9; Option A about flowers is irrelevant and disrupts the action sequence; digging a hole leads naturally to finding something hard.

### seven_select-sp-中考-6ei8w8
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I took out some colored paper, scissors an
- Blank 1: current `0:A. Then I began to work on the card carefully.` -> suggested `1:B. I felt very sad and didn’t know what to do.`; confidence 0.9; The context 'I had no money' naturally leads to feeling sad and unsure, not immediately starting to make a card.
- Blank 5: current `5:F. She looked very happy and thanked me a lot.` -> suggested `3:D. She hugged me and said it was the best gift she had ever received.`; confidence 0.85; After tears, a hug and heartfelt words provide a stronger emotional climax and directly support the lesson about love being the best gift.

### seven_select-sp-中考-7iu18g
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I didn’t have much money. (1) I decided to make a card by myself. I got some colored paper, glue a
- Blank 1: current `4:I ran to the store to buy some flowers.` -> suggested `0:I wanted to buy a new dress for her.`; confidence 0.95; Option E contradicts the lack of money and the decision to make a card; Option A fits as an abandoned initial desire.

### seven_select-sp-中考-7pp7rl
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was Mother’s Day, and Lily wanted to do something special for her mom. She got up early and went to the kitchen quietly. (1) She found some bread, eggs and milk in the fridge. (
- Blank 3: current `3:She also wrote a card and put it on the tray.` -> suggested `2:Next, she toasted two slices of bread.`; confidence 0.9; The cooking sequence requires toasting bread after cooking the egg, not inserting a card.
- Blank 4: current `6:She quietly opened the door and went in.` -> suggested `3:She also wrote a card and put it on the tray.`; confidence 0.85; After plating, adding a card is logical before carrying the tray; opening the door is premature.

### seven_select-sp-中考-7ytrvz
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was a dark and rainy afternoon. Tom was walking home from school when he saw an old woman standing by the road. She looked wet and cold. (1) He went up to her and asked if she n
- Blank 2: current `6:G. The old woman lived alone in a small house.` -> suggested `1:B. The woman thanked Tom and his mother again and again.`; confidence 0.9; After Tom buys her a hot drink and calls his mother, the natural next step is the woman expressing gratitude, not a background detail about her living alone.
- Blank 3: current `1:B. The woman thanked Tom and his mother again and again.` -> suggested `6:G. The old woman lived alone in a small house.`; confidence 0.85; After the woman is driven home, it is logical to mention she lived alone, which explains why she was out and needed help; gratitude would be more natural earlier.

### seven_select-sp-中考-830gqq
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my father and I decided to plant some flowers in our backyard. (1) We bought some seeds and tools from the shop nearby. When we started digging, my shovel hit somethin
- Blank 4: current `1:B. Then we went back home to watch TV.` -> suggested `3:D. After that, we cleaned the box and put it on the shelf.`; confidence 0.95; Going home to watch TV after finding the box and planting flowers is incoherent; cleaning and shelving the box fits the narrative flow.

### seven_select-sp-中考-8d0b05
- Type: seven_select; exam: 中考; level: lv1
- Passage: Tom’s family moved to a new house last month. The house was nice, but the garden was a mess. (1) He decided to turn it into a vegetable garden. (2) He asked his mother to help him 
- Blank 3: current `2:Tom’s mother was also happy and praised him.` -> suggested `1:Tom and his mother planted the seeds in the soil.`; confidence 0.95; After buying seeds, planting is the logical next step; praise is premature.
- Blank 4: current `3:The garden was too small for a vegetable garden.` -> suggested `2:Tom’s mother was also happy and praised him.`; confidence 0.9; Seeing sprouts naturally leads to praise; 'too small' contradicts the story.
- Blank 5: current `4:Tom wanted to grow flowers instead of vegetables.` -> suggested `-1:`; confidence 0.95; No suitable option; current option contradicts the vegetable garden theme.

### seven_select-sp-中考-8i1g8g
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my birthday. I didn’t expect any big celebration because my parents were busy at work. (1) When I opened the door, I saw a big box on the table. (2) I carefully o
- Blank 4: current `5:I felt very tired after the long day.` -> suggested `3:All my friends came to play with me that afternoon.`; confidence 0.9; The passage describes playing in the garden; 'friends came to play' fits the joyful tone and leads naturally to 'best birthday', while 'tired' contradicts the positive conclusion.

### seven_select-sp-中考-8ko5zz
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousins and I decided to give her a special gift. (1) We wanted to show her how much we loved her. First, we made a big card with
- Blank 5: current `0:A. We bought a big cake from the store.` -> suggested `1:B. We all felt very happy and proud.`; confidence 0.95; After the grandmother's positive reaction, the logical conclusion is the family's emotional response, not buying a cake which would have been mentioned earlier.

### seven_select-sp-中考-9omdbd
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, Tom helped his grandfather work in the garden. (1) He thought it would be just watering and weeding. But his grandfather gave him a small shovel and asked him to dig a
- Blank 2: current `4:“I want you to dig a hole here,” Grandpa said with a smile.` -> suggested `1:“What are we going to do?” Tom asked.`; confidence 0.9; Grandpa's instruction is redundant after 'asked him to dig a hole'; Tom's question fits naturally.

### seven_select-sp-中考-b99lkp
- Type: seven_select; exam: 中考; level: lv1
- Passage: One afternoon, Tom was on his way home from school. He got on a bus and found a seat near the window. (1) He noticed an old woman standing with a heavy bag. (2) Tom stood up and of
- Blank 1: current `0:A. Tom was reading a book when the bus moved.` -> suggested `1:B. The bus was very crowded and there were no empty seats.`; confidence 0.95; Tom found a seat, so the bus being crowded explains why the old woman stands; reading a book is irrelevant.

### seven_select-sp-中考-c0lldm
- Type: seven_select; exam: 中考; level: lv1
- Passage: The Internet is a great place to learn and have fun. However, it can also be dangerous if you are not careful. (1) First, never share your personal information like your full name,
- Blank 2: current `2:Remember that not everyone online is who they say they are.` -> suggested `0:A. It is important to keep your passwords secret.`; confidence 0.9; The example about password requests directly follows the first tip; A continues the password theme coherently, while C is too general for this position.
- Blank 5: current `6:Staying safe online is not difficult if you know what to do.` -> suggested `5:F. Always use a strong password that is hard to guess.`; confidence 0.9; Blank 5 is the last tip before the concluding sentence; G is a concluding statement that belongs after the list, not before it. F provides a specific tip consistent with the list pattern.

### seven_select-sp-中考-cgm5hj
- Type: seven_select; exam: 中考; level: lv1
- Passage: In the past, students usually sat in classrooms and listened to their teachers. But now, things are changing. (1) This new way of learning is called "online learning". With the hel
- Blank 1: current `1:Online learning makes it possible for students to learn at their own pace.` -> suggested `4:Students can use computers or tablets to join live classes.`; confidence 0.8; The blank introduces 'this new way of learning' after 'things are changing'. Option E directly describes how students use devices to join live classes, which fits the introduction of online learning. Option B is a benefit that fits better after the method is introduced.
- Blank 2: current `4:Students can use computers or tablets to join live classes.` -> suggested `1:Online learning makes it possible for students to learn at their own pace.`; confidence 0.8; After blank 1 introduces online learning, blank 2 should elaborate on advantages. Option B ('learn at their own pace') logically follows the general description, while E (joining live classes) is more specific and fits better in blank 1.

### seven_select-sp-中考-cjnc2l
- Type: seven_select; exam: 中考; level: lv1
- Passage: The Internet is a great place to learn and have fun. But it can also be dangerous if you are not careful. (1) First, never share your personal information like your full name, addr
- Blank 2: current `1:Always use a strong password for your accounts.` -> suggested `5:Third, be careful about what you post on social media.`; confidence 0.95; The passage uses 'First', 'Second', 'Finally' as sequential markers. Blank 2 follows 'Second' and should be a third tip, not a password tip that breaks the sequence. Option F fits the sequence and topic.
- Blank 3: current `4:Never agree to meet someone you only know online without a parent.` -> suggested `1:Always use a strong password for your accounts.`; confidence 0.8; After moving the 'Third' tip to blank 2, blank 3 needs a general safety tip. Option B fits as an additional unnumbered tip, while the current E is a specific tip that would be better placed after 'Finally'.
- Blank 4: current `5:Third, be careful about what you post on social media.` -> suggested `4:Never agree to meet someone you only know online without a parent.`; confidence 0.9; Blank 4 follows 'Finally', so a numbered tip like 'Third' is out of place. Option E is a specific caution that fits naturally as a final tip before the concluding sentence.

### seven_select-sp-中考-efwe22
- Type: seven_select; exam: 中考; level: lv1
- Passage: When you meet someone for the first time, you want to make a good impression. (1) Here are some simple tips that can help you. First, smile warmly. A smile shows that you are frien
- Blank 2: current `3:D. A first impression is often the most important one.` -> suggested `0:A. It makes others feel comfortable around you.`; confidence 0.9; Option D is a general statement that disrupts local coherence; A directly follows 'smile warmly' and explains its effect.

### seven_select-sp-中考-eiw4vx
- Type: seven_select; exam: 中考; level: lv1
- Passage: Everyone wants to have good friends. But do you know how to be a good friend? (1) First, always be honest with your friends. If you make a mistake, say sorry. (2) Second, listen to
- Blank 5: current `2:C. Third, always share your secrets with everyone.` -> suggested `5:F. Finally, never talk to your friends when they are upset.`; confidence 0.85; Option C contradicts the positive theme and is ungrammatical as a concluding tip; F, though negative, fits the 'Finally' sequence and the context of handling upset friends.

### seven_select-sp-中考-ey0y6d
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often feel tired when studying for a long time? Many students have the same problem. (1) In fact, taking short breaks can help you learn better. (2) For example, after 25 mi
- Blank 3: current `2:Your body also needs to move to stay healthy.` -> suggested `6:These activities help your body and mind relax.`; confidence 0.9; The context lists specific break activities (stand, drink water, look out window); G directly refers to 'these activities' and fits the flow, while C is a general statement that disrupts the sequence.
- Blank 4: current `6:These activities help your body and mind relax.` -> suggested `2:Your body also needs to move to stay healthy.`; confidence 0.85; After describing stretches, C provides a logical reason for doing them, while G would be redundant and out of place here.

### seven_select-sp-中考-f2pb5f
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn't expect anything special because my parents were busy with work. (1) When I came back home, the house was dark and quiet. I felt a little sad. 
- Blank 1: current `0:Suddenly, the lights turned on.` -> suggested `1:I went to my room and did my homework.`; confidence 0.9; The lights turning on abruptly after entering a dark quiet house is unnatural; going to one's room first maintains narrative flow before the surprise.
- Blank 2: current `1:I went to my room and did my homework.` -> suggested `0:Suddenly, the lights turned on.`; confidence 0.95; Doing homework after feeling sad breaks the surprise sequence; lights turning on logically leads to parents jumping out.

### seven_select-sp-中考-g8vcbj
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, I stayed at home alone because my parents went to visit my grandparents. I was doing my homework when I heard a strange noise from the kitchen. (1) I walked quietly 
- Blank 4: current `3:After that, I went back to my homework.` -> suggested `5:I named the bird Lucky and kept it as a pet.`; confidence 0.9; The rescue narrative ends with the bird being taken away; 'went back to my homework' is illogical and breaks the sequence, while naming it as a pet contradicts the rescue.

### seven_select-sp-中考-ggktco
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my mother’s birthday. I wanted to give her something special, but I had no money. (1) I decided to make a card by myself. I found some paper, colored pencils and gl
- Blank 2: current `2:I also cut out some small flowers from old magazines and stuck them around the cake.` -> suggested `4:After finishing, I put the card in an envelope.`; confidence 0.9; The logical sequence requires writing inside the card before cutting flowers; blank 2 should be the writing step, but the current option C (cutting flowers) is misplaced. Option E fits better as a later step, but the correct order is draw, write, cut flowers, then envelope. The current key disrupts the narrative flow.
- Blank 3: current `4:After finishing, I put the card in an envelope.` -> suggested `2:I also cut out some small flowers from old magazines and stuck them around the cake.`; confidence 0.9; Cutting flowers should occur before putting the card in an envelope. The current key places the envelope step at blank 3, but the flowers step logically precedes it. Swapping the two restores the correct order.

### seven_select-sp-中考-k287eb
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousins and I decided to give her a surprise. (1) We wanted to make her feel loved and happy. (2) I made a card with a picture of
- Blank 4: current `4:Tom also brought a box of chocolates for her.` -> suggested `6:After that, we all sang a birthday song together.`; confidence 0.9; The current key 'Tom also brought a box of chocolates' interrupts the logical flow: the album is presented, Grandma is moved, then a natural celebratory action (singing) fits before her thanks. The suggested option maintains coherence.

### seven_select-sp-中考-l94ko8
- Type: seven_select; exam: 中考; level: lv1
- Passage: In today’s fast-paced world, many students find it hard to balance schoolwork and fun. (1) However, with a little planning, you can enjoy both. First, make a weekly schedule. (2) F
- Blank 3: current `3:Exercise helps you stay healthy and think clearly.` -> suggested `6:Even a short break can refresh your mind.`; confidence 0.95; Blank 3 is about taking breaks; option D is about exercise, not breaks. Option G directly supports the break context.
- Blank 4: current `4:Sharing your feelings can make you feel better.` -> suggested `3:Exercise helps you stay healthy and think clearly.`; confidence 0.95; Blank 4 follows 'don't forget to exercise' and mentions running/dancing; option D explains exercise benefits, while option E is about sharing feelings.
- Blank 5: current `0:Many students feel too tired to do anything after school.` -> suggested `4:Sharing your feelings can make you feel better.`; confidence 0.95; Blank 5 follows 'talk to your parents or friends when stressed'; option E matches sharing feelings, option A is unrelated.

### seven_select-sp-中考-lkh0tp
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom helped his mother plant some flowers in the garden. (1) He was surprised to find a small, dirty box under the soil. (2) Tom opened it carefully. Inside the box, 
- Blank 2: current `1:He decided to throw the box away.` -> suggested `5:He picked up the box and cleaned it with a cloth.`; confidence 0.95; Throwing away the box contradicts the next action of opening it; picking it up and cleaning it is logical.
- Blank 4: current `3:To their surprise, the box opened.` -> suggested `2:The key didn’t fit any lock in the house.`; confidence 0.9; The current key 'To their surprise, the box opened' is premature; they first try the key on other locks, and only after that do they try the attic box.

### seven_select-sp-中考-n9u5u8
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last month, our school held a robot-building competition. My friend Tom and I decided to join it. (1) We had to build a robot that could move a ball into a goal. At first, we worke
- Blank 5: current `6:G. We won the second place.` -> suggested `1:B. We felt very proud and excited.`; confidence 0.9; The passage does not mention winning a prize; G is unsupported. B fits the positive tone and leads naturally to planning for next year.

### seven_select-sp-中考-nq4u58
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, my mother and I decided to plant some flowers in our backyard. (1) We bought some seeds from the market and prepared the soil. While digging, I suddenly hit something 
- Blank 3: current `6:We read the note aloud and laughed together.` -> suggested `5:It looked like a treasure chest from a story.`; confidence 0.8; The blank is placed right after 'inside' and before the note's content is quoted; describing the box as a treasure chest fits the immediate context better than reading the note aloud.
- Blank 5: current `2:To our joy, the coins were still valuable.` -> suggested `0:We told Dad about the discovery that evening.`; confidence 0.9; Mentioning coin value after they have been reburied and flowers planted is incoherent; telling Dad that evening is a natural concluding action.

### seven_select-sp-中考-o37s3g
- Type: seven_select; exam: 中考; level: lv1
- Passage: It was a cold winter morning. Lily and her brother Tom wanted to do something special for their mother. (1) They decided to make breakfast for her. Lily got some bread and eggs fro
- Blank 4: current `0:A. Tom broke a cup and felt sorry.` -> suggested `2:C. Mom was still sleeping when they came in.`; confidence 0.95; The passage states they walked quietly and mother was surprised, implying she was asleep; 'Tom broke a cup' contradicts the careful preparation.
- Blank 5: current `2:C. Mom was still sleeping when they came in.` -> suggested `0:A. Tom broke a cup and felt sorry.`; confidence 0.9; After mother hugs them and they eat together, 'Mom was still sleeping' is impossible; 'Tom broke a cup' is the only plausible option among the remaining.

### seven_select-sp-中考-p1pwct
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, Tom decided to help his mother in the garden. He put on his gloves and began to pull out weeds. (1) Suddenly, he noticed something shiny under a big stone. (2) He ca
- Blank 5: current `2:His mother was busy cooking in the kitchen.` -> suggested `5:He wanted to keep the coin for himself.`; confidence 0.85; Mother being busy cooking is irrelevant after the treasure reveal; the suggested option provides a logical emotional reaction leading to pride.

### seven_select-sp-中考-pmmlql
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you sometimes feel that you study hard but still cannot remember things well? You are not alone. Many students have the same problem. (1) Scientists have found that the way we s
- Blank 4: current `6:G. Your brain works better when you are relaxed.` -> suggested `4:E. Sleep is very important for our health.`; confidence 0.9; The context directly discusses sleeping well and its role in processing learning, so a sentence about sleep importance fits better than a general relaxation statement.
- Blank 5: current `4:E. Sleep is very important for our health.` -> suggested `6:G. Your brain works better when you are relaxed.`; confidence 0.85; Blank 5 is the concluding tip; after discussing sleep, a general relaxation statement serves as a broader final tip, while sleep importance is already covered in blank 4.

### seven_select-sp-中考-potfhi
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my birthday. I woke up early and felt very excited. (1) I walked into the living room and saw a big box on the table. (2) My parents smiled and said, “Open it!” I
- Blank 3: current `2:It was a book about animals.` -> suggested `5:I was so surprised that I couldn’t say a word.`; confidence 0.95; The box contains a bicycle, not a book; surprise reaction fits naturally after opening.
- Blank 4: current `1:Then we rode to the park and had a great time.` -> suggested `0:I thanked them and gave them a big hug.`; confidence 0.9; Thanking should follow opening the gift, before the ride suggestion.
- Blank 5: current `5:I was so surprised that I couldn’t say a word.` -> suggested `1:Then we rode to the park and had a great time.`; confidence 0.9; After father suggests a ride, the natural next step is going for the ride.

### seven_select-sp-中考-qpcbxh
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last spring, my family moved to a new house with a small yard. The yard was empty except for some old stones. (1) My father decided to turn it into a garden. At first, I thought it
- Blank 2: current `0:A. He asked me to help him every day.` -> suggested `3:D. However, I changed my mind after a few weeks.`; confidence 0.95; After 'I thought it was a boring idea,' a contrast is needed; option A about the father asking for help is irrelevant here.
- Blank 5: current `5:F. Everyone in the family enjoyed the fresh vegetables.` -> suggested `6:G. It became the most beautiful place in our neighborhood.`; confidence 0.9; After neighbors' praise, a summarizing statement about the garden's beauty fits better than a detail about enjoying vegetables, which should come earlier.

### seven_select-sp-中考-s7c393
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousin and I wanted to give her a special gift. (1) We decided to make a photo album for her. First, we collected all the old fam
- Blank 1: current `1:B. Finally, we decorated the cover with colorful paper.` -> suggested `0:A. We bought a new camera for her.`; confidence 0.9; The current answer is a concluding step, but the blank is at the beginning of the process; the suggested option provides a plausible alternative gift idea that leads to the decision to make an album.

### seven_select-sp-中考-t6so92
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn’t expect anything special because my parents were very busy. (1) When I walked into the living room, I saw a big box on the table. (2) I opened 
- Blank 5: current `2:C. I felt a little sad at first.` -> suggested `-1:`; confidence 0.95; The passage ends positively; sadness contradicts the flow and no suitable replacement is suggested.

### seven_select-sp-中考-tkocv3
- Type: seven_select; exam: 中考; level: lv1
- Passage: Everyone wants to be happy, but not everyone knows how to find happiness. (1) Some people think that having a lot of money will make them happy. (2) In fact, happiness often comes 
- Blank 5: current `2:Another way to find happiness is to spend time with family and friends.` -> suggested `4:Instead, it is a journey that we experience every day.`; confidence 0.9; The current option C introduces a new point about family and friends, which does not logically follow 'happiness is not a destination' and disrupts the flow to the concluding call to action. Option E directly continues the thought and leads naturally into 'So, start today.'

### seven_select-sp-中考-tlsupb
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was Mother’s Day. Tom and his sister Lily wanted to give their mom a special surprise. (1) They decided to make breakfast for her. Tom got the bread and milk from the f
- Blank 4: current `4:Finally, they finished and felt proud.` -> suggested `3:D. Mom was still sleeping when they came in.`; confidence 0.95; The current key 'Finally, they finished and felt proud.' breaks the chronological order; Mom must be sleeping before they enter her bedroom.
- Blank 5: current `1:After breakfast, they went to the park.` -> suggested `4:E. Finally, they finished and felt proud.`; confidence 0.9; After the gift-giving and happy moment, cleaning up and feeling proud is the natural conclusion; going to the park is unsupported.

### seven_select-sp-中考-x3otpm
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my birthday. I didn't expect any gifts because my family was busy preparing for a trip. (1) When I came back from school, I found a small box on my desk. It was wra
- Blank 3: current `5:F. I knew it was from my mother because she always listens carefully.` -> suggested `1:B. However, my mother remembered my wish.`; confidence 0.9; After mother says she heard the wish, the natural next line is her revealing she remembered it, not a generic listening statement.
- Blank 4: current `2:C. I was a little disappointed at first.` -> suggested `5:F. I knew it was from my mother because she always listens carefully.`; confidence 0.9; After the hug and thanks, a reflective statement about mother's attentiveness fits; disappointment is out of place.
- Blank 5: current `0:A. I decided to buy a pen for myself.` -> suggested `4:E. I ran to my mother and asked who gave it to me.`; confidence 0.95; The final blank should be the immediate reaction after opening the box, asking who gave it, before mother's explanation.

### seven_select-sp-中考-x80hez
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday, Mom asked me to help her in the garden. (1) I thought it would be boring, but I said yes anyway. When we got outside, Mom handed me a small shovel and pointed to a cor
- Blank 3: current `0:I was surprised and asked why she did that.` -> suggested `4:Then Mom told me to open it.`; confidence 0.95; After hitting the box, the logical next action is to open it, not to ask why. Option E fits the sequence naturally.
- Blank 4: current `4:Then Mom told me to open it.` -> suggested `0:I was surprised and asked why she did that.`; confidence 0.9; After opening the box and seeing the photo, surprise and asking why is the natural reaction. The current key E at blank 4 is misplaced.

### seven_select-sp-中考-xnm5qu
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Sunday was my grandmother’s 70th birthday. My cousin and I wanted to give her something special. (1) We decided to make a photo album by ourselves. First, we collected photos 
- Blank 3: current `2:C. There were many old photos in the box.` -> suggested `-1:`; confidence 0.9; The box contains the album, not old photos; the sentence is incoherent with the context.
- Blank 5: current `0:A. We bought a big cake from the shop.` -> suggested `-1:`; confidence 0.9; Buying a cake is irrelevant after the gift has been given and appreciated; no logical connection.

### seven_select-sp-中考-yd3u0g
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Friday, our class went on a trip to the science museum. (1) We saw many interesting exhibits about space and robots. (2) A guide told us that the first robot was made in 1954.
- Blank 4: current `3:We felt very tired but happy on the way back.` -> suggested `6:G. Many of us bought robot toys in the gift shop.`; confidence 0.9; After lunch in the museum garden, visiting the gift shop is a logical next step before leaving; 'on the way back' is premature.
- Blank 5: current `4:Finally, we took a group photo in front of the museum.` -> suggested `3:D. We felt very tired but happy on the way back.`; confidence 0.9; The group photo should be taken before departure; 'on the way back' is a natural concluding sentence after the photo.

### seven_select-sp-中考-ys74q3
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday, my parents were busy in the kitchen, so I decided to do something special for them. I went to the backyard and started planting some flower seeds in the empty flower
- Blank 2: current `5:F. I planted the seeds in a straight line and marked the spots with small sticks.` -> suggested `6:G. At first, I didn't know what to plant, but finally I chose sunflowers.`; confidence 0.9; Option F describes planting in a line and marking spots, which should logically come before covering with soil, not after. Option G provides the initial decision of what to plant, fitting before the covering step.
- Blank 4: current `0:A. I thought they would be angry because I didn't ask for permission.` -> suggested `4:E. They told me that they had watched me from the window every afternoon.`; confidence 0.95; After 'they had already noticed', E directly explains how they noticed, while A introduces an unrelated fear of anger. E flows naturally into the mother's proud statement.

### seven_select-sp-中考-z7sf2v
- Type: seven_select; exam: 中考; level: lv1
- Passage: Do you often have trouble sleeping at night? You are not alone. Many teenagers find it hard to fall asleep. (1) But the good news is that there are simple ways to improve your slee
- Blank 3: current `5:Make sure your room is clean and free of noise.` -> suggested `1:The blue light from screens can make it harder to fall asleep.`; confidence 0.95; Blank 3 follows 'avoid using electronic devices before bed' and precedes 'Instead, you can read a book...', so it should explain why screens are harmful, not talk about room cleanliness.
- Blank 4: current `2:Having a heavy meal may cause discomfort and keep you awake.` -> suggested `5:Make sure your room is clean and free of noise.`; confidence 0.95; Blank 4 is under 'make your bedroom comfortable' and mentions quiet, dark, cool environment; the sentence about room cleanliness fits here, not the heavy meal sentence.
- Blank 5: current `3:Some people like to drink coffee before going to bed.` -> suggested `2:Having a heavy meal may cause discomfort and keep you awake.`; confidence 0.95; Blank 5 follows 'don’t eat too much before bedtime', so the sentence about heavy meal causing discomfort is directly relevant; coffee is not mentioned in the preceding context.

### seven_select-sp-中考-zil3q1
- Type: seven_select; exam: 中考; level: lv1
- Passage: Last Saturday was my 15th birthday. I didn't expect a big party because my family was busy. (1) In the morning, I helped my mom clean the house and then did my homework. (2) When I
- Blank 2: current `2:C. I thanked him and gave him a hug.` -> suggested `5:F. I put on the watch and showed it to everyone.`; confidence 0.9; After receiving the watch, the natural next action is to put it on and show it, not to thank 'him' before the gift is opened.
- Blank 3: current `5:F. I put on the watch and showed it to everyone.` -> suggested `2:C. I thanked him and gave him a hug.`; confidence 0.9; After putting on the watch and showing it, the logical next step is to thank the grandpa.
- Blank 4: current `3:D. I went to the kitchen to get some water.` -> suggested `6:G. The cake was chocolate with strawberries on top.`; confidence 0.85; After the gift and thanks, describing the cake fits the party context; going to get water breaks the flow.

### seven_select-sp-高考-10it3f1
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people spend their whole lives searching for happiness, yet it often feels just out of reach. (1) Actually, happiness is not a destination but a by-product of how we live our 
- Blank 5: current `4:Instead, they find joy in everyday moments and meaningful relationships.` -> suggested `1:However, many people mistakenly believe that happiness comes from money or fame.`; confidence 0.85; Option E has no clear antecedent for 'they', and the concluding sentence contrasts 'having more' with 'appreciating what you have', which Option B introduces naturally.

### seven_select-sp-高考-10jy1qc
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today's fast-paced world, many people spend most of their workday sitting in front of a screen. This sedentary lifestyle can lead to various health problems, such as back pain a
- Blank 1: current `0:To address this issue, some companies have introduced standing desks.` -> suggested `1:Not only does it improve physical health, but it also boosts mental well-being.`; confidence 0.9; Option A introduces standing desks, which is a different solution and disrupts the logical flow from sedentary problems to walking meetings. Option B bridges the health issue to walking meetings.
- Blank 5: current `5:Walking meetings are not suitable for all weather conditions.` -> suggested `6:Once you try it, you might find it hard to go back to traditional meetings.`; confidence 0.85; Option F introduces a new limitation after the concluding sentence has started, breaking coherence. Option G provides a natural positive conclusion.

### seven_select-sp-高考-10x8zhy
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the importance of small talk. They see it as meaningless chatter that wastes time. (1) In fact, these brief exchanges can build bridges between strangers 
- Blank 1: current `1:B. These seemingly unimportant topics often reveal shared interests.` -> suggested `0:A. However, many people avoid it because they fear awkward silences.`; confidence 0.9; The passage starts with people underestimating small talk, then 'In fact' introduces a positive counterpoint. Option A provides a logical contrast (why people avoid it) before the positive turn, while B jumps to shared interests without a transition.
- Blank 4: current `0:A. However, many people avoid it because they fear awkward silences.` -> suggested `4:E. Even a brief chat can leave a positive impression on others.`; confidence 0.85; The preceding sentence discusses small talk opening doors in professional settings, and the following sentence concludes with 'Therefore, mastering... is a valuable skill.' Option E supports this positive outcome, while A introduces avoidance, breaking the logical flow.

### seven_select-sp-高考-120lsy1
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, it is easy to overlook the impact of small acts of kindness. (1) However, research shows that even the simplest gestures can significantly boost both the g
- Blank 5: current `1:Therefore, we should always expect something in return.` -> suggested `-1:`; confidence 0.95; The current key contradicts the passage's theme of selfless kindness and disrupts the positive concluding tone.

### seven_select-sp-高考-12dbgz4
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving big goals requires dramatic changes. However, research in psychology suggests that small, consistent habits can lead to remarkable transformation
- Blank 3: current `4:Eventually, you might find yourself reading dozens of books a year without effort.` -> suggested `3:D. Once the habit is established, you can expand it gradually.`; confidence 0.9; Option E about reading books is irrelevant here; the context is about the walk example and the following sentence on automatic habits, which D directly introduces.
- Blank 4: current `3:Once the habit is established, you can expand it gradually.` -> suggested `4:E. Eventually, you might find yourself reading dozens of books a year without effort.`; confidence 0.85; Option D about expanding habits is already covered by the preceding sentence; E provides a concrete outcome that fits the contrast with process focus.

### seven_select-sp-高考-13yssx9
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. However, research shows that brief, casual conversations can significantly improve our social wel
- Blank 4: current `5:In fact, a simple greeting with a stranger can boost mood and create a sense of belonging.` -> suggested `0:These interactions are not just about filling silence; they build emotional connections.`; confidence 0.9; The current option repeats an earlier point, while the suggested option logically connects the preceding and following sentences.

### seven_select-sp-高考-14roshf
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often face requests from others that we cannot or should not fulfill. Learning to say no is an essential skill for maintaining healthy boundaries. (1) Many p
- Blank 2: current `0:It can prevent you from becoming overburdened and stressed.` -> suggested `2:By saying no, you create space for your own priorities and goals.`; confidence 0.85; Current option A has unclear antecedent 'it' and shifts topic to stress prevention; option C directly continues the theme of benefits of saying no and fits the flow.
- Blank 5: current `2:By saying no, you create space for your own priorities and goals.` -> suggested `0:It can prevent you from becoming overburdened and stressed.`; confidence 0.8; Option C is a general benefit better placed earlier; option A provides a logical concluding benefit leading naturally to the final summary sentence.

### seven_select-sp-高考-158xqym
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as meaningless chatter. However, research has shown that these brief exchanges can significantly impact our social and
- Blank 2: current `0:They help create a sense of belonging in a community.` -> suggested `2:These interactions can also boost one's mood and reduce stress.`; confidence 0.85; Option A repeats community belonging from blank 1, while blank 2 follows a workplace example; option C with 'also' links better and fits the context.

### seven_select-sp-高考-15tyjjn
- Type: seven_select; exam: 高考; level: lv2
- Passage: A smile is one of the most powerful tools we have in human interaction. It can break down barriers and create connections almost instantly. (1) However, many of us underestimate th
- Blank 3: current `1:True smiles come from the heart.` -> suggested `4:E. Conversely, a genuine smile can brighten someone's entire day.`; confidence 0.85; The preceding sentence contrasts forced smiles with genuine smiles; 'Conversely' directly signals this contrast, while 'True smiles come from the heart' is too vague and does not connect logically.
- Blank 4: current `4:Conversely, a genuine smile can brighten someone's entire day.` -> suggested `1:B. True smiles come from the heart.`; confidence 0.8; The blank introduces the definition of a Duchenne smile; 'True smiles come from the heart' naturally leads into the explanation, whereas 'Conversely, a genuine smile...' is a contrast that does not prepare for the definition.

### seven_select-sp-高考-15u85rf
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that constantly demands our attention, learning to say no is an essential skill for maintaining mental health. (1) However, many people struggle with this simple word be
- Blank 1: current `6:Actually, saying yes to everything leads to burnout and resentment.` -> suggested `1:Many people feel guilty when they turn down a friend's request.`; confidence 0.85; Option G introduces a new topic about 'saying yes' without directly explaining the struggle mentioned in the previous sentence, while Option B provides a specific reason (guilt) that logically follows 'However, many people struggle...'.

### seven_select-sp-高考-16r466n
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world filled with constant noise, silence has become a rare treasure. Many people feel uncomfortable when there is a pause in conversation, rushing to fill it with words. (1) 
- Blank 3: current `4:Scientists have found that periods of silence can reduce stress and improve focus.` -> suggested `2:In contrast, some Eastern cultures view silence as a way to show agreement.`; confidence 0.9; The passage contrasts cultural attitudes; after Finland (Western), the next logical step is an Eastern perspective, not a scientific fact.

### seven_select-sp-高考-1784xsm
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. (1) In fact, these brief exchanges can strengthen social bonds and open doors to new opportunitie
- Blank 3: current `6:Others believe it is a waste of precious time.` -> suggested `3:Without it, people may feel isolated or miss valuable chances to connect.`; confidence 0.9; G repeats the idea already stated in the passage, while D provides a logical contrast and fits the 'However' in the next sentence.

### seven_select-sp-高考-17li2eh
- Type: seven_select; exam: 高考; level: lv2
- Passage: In recent years, the concept of micro-habits has gained increasing attention among psychologists and self-improvement enthusiasts. (1) Unlike grand resolutions that often fail with
- Blank 2: current `2:Once you start, you will feel motivated to do more.` -> suggested `1:However, their real power is often underestimated.`; confidence 0.9; The contrast between initial insignificance and later transformation is better served by the suggested option, which provides a clear discourse marker and logical flow.
- Blank 5: current `5:Instead, they gradually become part of your identity.` -> suggested `2:Once you start, you will feel motivated to do more.`; confidence 0.85; The suggested option directly supports the concluding advice to start small, while the current option lacks a clear antecedent and is less coherent.

### seven_select-sp-高考-1a6qpgo
- Type: seven_select; exam: 高考; level: lv2
- Passage: Friendship is one of the most valuable relationships in life, yet maintaining it over time is not always easy. (1) However, true friendship requires more than just shared interests
- Blank 1: current `6:Without mutual effort, even the best friendship can fade away.` -> suggested `0:Many people believe that friendship happens naturally without any effort.`; confidence 0.85; The contrast 'However' in the next sentence logically follows a common misconception that friendship is effortless, not a statement about effort.
- Blank 5: current `0:Many people believe that friendship happens naturally without any effort.` -> suggested `6:Without mutual effort, even the best friendship can fade away.`; confidence 0.8; The concluding sentence before 'After all' should provide a warning about effort, not a general belief, to lead into the final remark.

### seven_select-sp-高考-1aymfo8
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, it's easy to overlook the impact of small gestures. (1) However, research shows that even tiny acts of kindness can significantly boost both the giver's an
- Blank 5: current `5:Therefore, it is important to teach children the value of kindness from an early age.` -> suggested `4:Some argue that kindness is a natural human instinct that requires no encouragement.`; confidence 0.8; F introduces an unsupported new topic about teaching children, while E offers a contrasting viewpoint that fits the argumentative flow before the conclusion.

### seven_select-sp-高考-1cyfncd
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies being busy, learning to say no is an essential skill for maintaining mental health and personal boundaries. (1) However, many people struggle with t
- Blank 2: current `1:Many people believe that saying yes to everything is the key to success.` -> suggested `3:Instead, they often say yes reluctantly and later regret it.`; confidence 0.9; The current option introduces a new belief without a clear link, while the suggested option directly contrasts with the preceding sentence about the benefits of saying no, providing a natural transition.
- Blank 3: current `3:Instead, they often say yes reluctantly and later regret it.` -> suggested `1:Many people believe that saying yes to everything is the key to success.`; confidence 0.85; The current option is a continuation of the struggle that fits better after blank 1; the suggested option provides a general belief that leads into the contrast of saying no, fitting the flow after freeing up time.

### seven_select-sp-高考-1eir1j3
- Type: seven_select; exam: 高考; level: lv2
- Passage: In recent years, the concept of micro-habits has gained widespread popularity. Unlike grand resolutions that often fail, micro-habits are tiny, manageable actions that require mini
- Blank 3: current `4:E. Gradually, you can expand them into larger routines.` -> suggested `5:F. A micro-habit might seem insignificant at first.`; confidence 0.8; E introduces expansion too early; F contrasts with the following 'This is because...' explanation, creating better coherence.
- Blank 4: current `2:C. These tiny habits are so easy that you can hardly say no to them.` -> suggested `0:A. They require no special equipment or planning.`; confidence 0.75; C repeats the easiness already implied; A provides a logical reason for reduced fear of failure, fitting the flow better.
- Blank 5: current `5:F. A micro-habit might seem insignificant at first.` -> suggested `4:E. Gradually, you can expand them into larger routines.`; confidence 0.9; F introduces a contrast that disrupts the concluding flow; E directly continues the idea of increasing difficulty.

### seven_select-sp-高考-1eob417
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where constant chatter and digital noise are the norm, the value of silence is often overlooked. (1) In fact, silence can be a powerful tool in communication, conveying 
- Blank 3: current `1:It also plays a crucial role in emotional support.` -> suggested `4:E. In fact, silence can be more powerful than words in certain situations.`; confidence 0.85; Option B's 'also' lacks a prior mention of emotional support; E better fits the context of silence's power in classroom discussions and processing.

### seven_select-sp-高考-1fdvgj4
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a small village nestled between green hills, there was a bamboo grove that everyone spoke of in whispers. The grove was said to be enchanted, but no one dared to enter after sun
- Blank 4: current `2:He carefully collected some insects to show his friends at school.` -> suggested `5:Instead of magic, he found a beautiful natural phenomenon.`; confidence 0.9; Collecting insects breaks the logical flow; the passage explicitly says he realized the 'magic' was a natural wonder, so F directly matches.

### seven_select-sp-高考-1hfy3mx
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often find ourselves agreeing to do things we don't really want to. This can lead to stress and burnout. (1) Learning to say no is a valuable skill that can 
- Blank 4: current `0:Setting clear boundaries helps you focus on what truly matters.` -> suggested `5:By saying no, you create more space for meaningful activities.`; confidence 0.85; The example of polite refusal directly leads to the benefit of saying no (F), which then transitions to the next sentence about respect; A introduces a new concept of boundaries that disrupts the flow.

### seven_select-sp-高考-1hwdw3x
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies busyness, learning to say no can be a powerful act of self-care. (1) However, many people find themselves agreeing to requests they would rather dec
- Blank 3: current `4:On the contrary, it enables you to be more present for the commitments you do make.` -> suggested `5:F. Without boundaries, even the most well-intentioned people can become overwhelmed.`; confidence 0.9; The sentence before blank 3 explains that setting boundaries is about protecting time and energy. Option F directly states the consequence of lacking boundaries, which logically follows. Option E introduces a contrast ('On the contrary') that does not fit the flow.
- Blank 4: current `5:Without boundaries, even the most well-intentioned people can become overwhelmed.` -> suggested `4:E. On the contrary, it enables you to be more present for the commitments you do make.`; confidence 0.85; Blank 4 is followed by an example of refusing a colleague to prevent work suffering. Option E explains that setting boundaries is not selfish but beneficial, leading naturally into the example. Option F would be redundant as the consequence of no boundaries was already addressed.

### seven_select-sp-高考-1jzolxs
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where constant chatter is often encouraged, the value of silence is frequently overlooked. (1) However, silence can be a powerful tool in communication, allowing for dee
- Blank 3: current `0:Many people feel anxious when there is a long pause in a conversation.` -> suggested `6:Some individuals find silence uncomfortable and try to avoid it at all costs.`; confidence 0.85; Option A is too specific about anxiety over long pauses, while the paragraph's contrast requires a general statement about discomfort with silence to lead into the next sentence about filling gaps.
- Blank 5: current `1:Silence can also be used as a form of punishment in some social settings.` -> suggested `0:Many people feel anxious when there is a long pause in a conversation.`; confidence 0.9; Option B about punishment is off-topic; the context of discomfort with silence and filling gaps is directly addressed by option A.

### seven_select-sp-高考-1k724nn
- Type: seven_select; exam: 高考; level: lv2
- Passage: Sleep is essential for our health, yet many people struggle to get enough quality rest. (1) However, there are several effective strategies that can help improve your sleep quality
- Blank 4: current `0:Additionally, engaging in physical activity during the day can help you fall asleep faster at night.` -> suggested `2:Investing in a good mattress and pillows can also make a big difference.`; confidence 0.95; Blank 4 follows 'Keep your bedroom dark, quiet, and at a cool temperature.' and should continue the sleep environment topic; option A about physical activity is unrelated and disrupts flow.
- Blank 3: current `2:Investing in a good mattress and pillows can also make a big difference.` -> suggested `0:Additionally, engaging in physical activity during the day can help you fall asleep faster at night.`; confidence 0.9; Blank 3 is in the pre-sleep routine paragraph; option C about mattress belongs to the environment section that follows, while option A fits as an additional daytime strategy.

### seven_select-sp-高考-1mentih
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. (1) In fact, these brief exchanges can strengthen social bonds and open doors to new opportunitie
- Blank 3: current `2:Instead, they can avoid small talk by staying silent or using their phones.` -> suggested `4:This skill can be especially useful when meeting new people in social events.`; confidence 0.9; Current option C suggests avoiding small talk, which contradicts the following sentence that gives a strategy (asking open-ended questions). Option E logically bridges the gap by referring to the skill of asking open-ended questions as useful in social events.

### seven_select-sp-高考-1muzc9n
- Type: seven_select; exam: 高考; level: lv2
- Passage: Sleep is something we all need, yet many of us struggle to get enough of it. (1) In fact, poor sleep can affect our mood, memory, and even our immune system. So what can we do to i
- Blank 4: current `1:B. Poor sleep has become a common problem in modern society.` -> suggested `4:E. Also, avoid using electronic devices before bed.`; confidence 0.95; The preceding sentence discusses blue light from screens interfering with melatonin, so the logical next sentence is advice to avoid electronic devices, not a general statement about poor sleep being common.

### seven_select-sp-高考-1mwslon
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where we are constantly surrounded by noise, silence is often undervalued. (1) However, silence can be a powerful tool in communication, offering space for reflection an
- Blank 3: current `2:It is often seen as an empty space that needs to be filled with conversation.` -> suggested `5:However, not all silences are the same; some are comfortable while others are tense.`; confidence 0.9; The current option C describes a negative view of silence, but the following sentences give positive examples of silence in different cultures, which fits better with F introducing a contrast about different types of silence.
- Blank 4: current `5:However, not all silences are the same; some are comfortable while others are tense.` -> suggested `2:It is often seen as an empty space that needs to be filled with conversation.`; confidence 0.9; After positive examples, blank 4 leads into 'Yet, many people feel uncomfortable...' which is a contrast; the current F about different silences does not set up that contrast, while C (negative view) does.

### seven_select-sp-高考-1n0v69v
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies busyness, learning to say no is a valuable skill. Many people feel guilty when they decline an invitation or refuse a request. (1) However, constant
- Blank 2: current `0:A. Setting boundaries can actually strengthen relationships in the long run.` -> suggested `5:F. Without clear boundaries, you may end up pleasing everyone but yourself.`; confidence 0.9; Option A introduces a new idea about relationships not supported by context; Option F logically follows 'limited resources' and leads into 'By setting boundaries'.
- Blank 3: current `5:F. Without clear boundaries, you may end up pleasing everyone but yourself.` -> suggested `0:A. Setting boundaries can actually strengthen relationships in the long run.`; confidence 0.85; Option F is a negative consequence that does not lead into the positive examples; Option A directly introduces setting boundaries before the examples.

### seven_select-sp-高考-1oes781
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced work environment, many people spend hours sitting in conference rooms. However, a growing number of companies are encouraging a different approach: walking me
- Blank 4: current `2:The key is to choose a quiet route without too much traffic or noise.` -> suggested `5:Walking meetings can also strengthen relationships between colleagues.`; confidence 0.9; Option C about choosing a quiet route is a practical tip that does not logically follow the example about communication; it disrupts the flow of benefits. Option F continues the theme of interpersonal benefits and connects naturally to the following sentence about breaking monotony.

### seven_select-sp-高考-1p6w8ax
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many successful people attribute their achievements to a well-structured morning routine. (1) However, establishing such a routine can be challenging for most of us. The key is to 
- Blank 2: current `2:Without it, you might waste time deciding what to do next.` -> suggested `3:D. It also helps you avoid feeling rushed in the morning.`; confidence 0.9; Option C's 'without it' lacks a clear antecedent; D directly continues the benefit of the simple act.
- Blank 3: current `3:It also helps you avoid feeling rushed in the morning.` -> suggested `2:C. Without it, you might waste time deciding what to do next.`; confidence 0.85; Option C directly elaborates on reducing decision fatigue; D is about avoiding rush, less coherent.

### seven_select-sp-高考-1pkbhk8
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk. They see it as meaningless chatter that wastes time. (1) In fact, these brief exchanges can build bridges between strangers and s
- Blank 2: current `1:A brief chat can also help reduce anxiety in social settings.` -> suggested `6:G. Moreover, small talk can even improve your mood and make you feel more connected.`; confidence 0.85; The example about weather leading to travel plans illustrates building bridges, not reducing anxiety; G continues the positive benefits from blank 1 and aligns better.
- Blank 3: current `2:This is because small talk often serves as a safe entry point for deeper conversations.` -> suggested `1:B. A brief chat can also help reduce anxiety in social settings.`; confidence 0.8; After the example, B adds another benefit, while C is a general explanation that fits better earlier; current placement disrupts flow.
- Blank 4: current `3:Without these initial icebreakers, many relationships would never get off the ground.` -> suggested `2:C. This is because small talk often serves as a safe entry point for deeper conversations.`; confidence 0.9; D refers to 'these initial icebreakers' but none have been mentioned; C directly explains the preceding idea and fits naturally.
- Blank 5: current `5:So next time you find yourself waiting in line, don't hesitate to start a light conversation.` -> suggested `3:D. Without these initial icebreakers, many relationships would never get off the ground.`; confidence 0.95; Current key duplicates the concluding sentence already in the passage; D fits as a supporting point before the conclusion.

### seven_select-sp-高考-1pqnl7m
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as trivial or a waste of time. (1) In fact, these brief exchanges can serve as social glue, helping to build connectio
- Blank 3: current `0:Some people find it difficult to break the ice in social situations.` -> suggested `6:They prefer to avoid it because they fear awkward silences.`; confidence 0.9; Option A introduces a new idea about difficulty breaking ice, but the context 'not everyone is comfortable' leads naturally to avoidance, and the next sentence 'With practice, anyone can learn' contrasts with avoidance, not with difficulty breaking ice.
- Blank 4: current `6:They prefer to avoid it because they fear awkward silences.` -> suggested `0:Some people find it difficult to break the ice in social situations.`; confidence 0.85; Option G about avoidance does not logically follow 'With practice, anyone can learn'; option A about difficulty breaking the ice aligns better with the subsequent advice on asking open-ended questions.

### seven_select-sp-高考-1q0y71m
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world filled with constant noise, silence is often undervalued. (1) However, silence can be a powerful tool in communication, offering space for reflection and deeper understa
- Blank 1: current `5:F. Silence is not merely the absence of sound; it is a form of expression.` -> suggested `0:A. Many people feel uncomfortable when a conversation falls silent.`; confidence 0.9; Option A provides a contrast that 'However' directly counters, while F is a general statement that does not set up the needed contrast.
- Blank 4: current `1:B. By remaining silent, we can also avoid saying something we might later regret.` -> suggested `3:D. A moment of silence can also help diffuse tension in a heated argument.`; confidence 0.85; D fits the emotional/relational theme better than B, which is about self-control.

### seven_select-sp-高考-1rfluk
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often overlook the importance of small talk. (1) However, this seemingly casual conversation plays a significant role in social interactions. It helps break 
- Blank 3: current `0:Many people consider it a waste of time.` -> suggested `1:Actually, small talk can be the first step to meaningful connections.`; confidence 0.9; Option A introduces a negative opinion that disrupts the positive logical flow about building relationships; Option B fits the progression.

### seven_select-sp-高考-1rsynow
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving big goals requires dramatic changes. However, research suggests that small, consistent habits can lead to remarkable results over time. (1) For e
- Blank 3: current `4:Yet most people fail because they try to change too much at once.` -> suggested `1:B. Many people, however, ignore the power of habits.`; confidence 0.9; Option E does not provide the referent 'they' needed for the following sentence; Option B does.
- Blank 4: current `1:Many people, however, ignore the power of habits.` -> suggested `4:E. Yet most people fail because they try to change too much at once.`; confidence 0.85; Option B repeats the idea from blank 3; Option E provides a logical contrast with 'On the other hand'.

### seven_select-sp-高考-1s2ex3p
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as trivial or a waste of time. (1) In fact, these brief exchanges can serve as the foundation for deeper relationships
- Blank 3: current `5:By noticing details in what others say, you become a better communicator.` -> suggested `6:Small talk often leads to unexpected opportunities.`; confidence 0.85; The example about weather leading to shared interests directly supports 'leads to unexpected opportunities', while F about noticing details is premature before the mention of observation skills.
- Blank 4: current `1:These skills are essential for both personal and professional growth.` -> suggested `5:By noticing details in what others say, you become a better communicator.`; confidence 0.9; F directly elaborates on 'active listening and observation skills' just mentioned, while B is a generic conclusion that fits better after the specific skill description.

### seven_select-sp-高考-1s4pq7o
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving great success requires dramatic changes. However, research shows that small, consistent habits can lead to remarkable results over time. (1) For 
- Blank 4: current `1:Instead, we should aim for big leaps to see quick results.` -> suggested `5:F. However, many people ignore the power of consistency.`; confidence 0.85; Blank 4 follows 'On the other hand, if we try to change everything at once...' which already contrasts with gradual change; B repeats the contrast awkwardly. F fits better as a general observation about people ignoring consistency, aligning with the preceding contrast.

### seven_select-sp-高考-1t4m82y
- Type: seven_select; exam: 高考; level: lv2
- Passage: In an age where digital distractions are everywhere, the simple act of reading a book quietly seems to be losing its appeal. However, research shows that silent reading offers uniq
- Blank 3: current `0:Silent reading also allows for a personal connection with the material, as you can imagine scenes and voices in your own way.` -> suggested `4:One major advantage of silent reading is the control it gives you over the reading speed.`; confidence 0.9; Option E directly continues the idea of controlling pace from the previous sentence, while Option A introduces a new topic that breaks coherence.
- Blank 4: current `5:This is why many teachers recommend silent reading time in classrooms.` -> suggested `0:Silent reading also allows for a personal connection with the material, as you can imagine scenes and voices in your own way.`; confidence 0.85; Option A adds a natural additional benefit after discussing concentration and stress, while Option F is a concluding statement that fits better later.
- Blank 5: current `1:Listening to an audiobook while doing other tasks is a common practice among busy people.` -> suggested `5:This is why many teachers recommend silent reading time in classrooms.`; confidence 0.9; Option F provides a logical lead-in to the concluding sentence, whereas Option B introduces an irrelevant contrast that disrupts the paragraph's flow.

### seven_select-sp-高考-1tjuy70
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often find ourselves agreeing to requests that we would rather decline. This can lead to stress and burnout. (1) Learning to say no is a valuable skill that 
- Blank 2: current `3:Thus, you might give in just to keep the peace.` -> suggested `0:Instead of feeling guilty, you can view it as a way to prioritize what truly matters.`; confidence 0.85; Option D describes giving in, but the next sentence contradicts that by saying saying no can be polite. Option A provides a positive reframe that leads naturally into the following advice.

### seven_select-sp-高考-1tnnhxb
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people dream of speaking a second language fluently, but few achieve it. (1) In fact, the key lies in consistent daily practice rather than occasional intensive study. (2) For
- Blank 3: current `3:Watching films with subtitles can also help a lot.` -> suggested `4:E. Moreover, speaking with native speakers is highly recommended.`; confidence 0.9; Blank 3 follows 'immersing yourself in the language through media like movies, music, or podcasts.' Option D repeats the idea of watching films, which is already covered. Option E introduces a new, logical next step: speaking with native speakers, which fits the progression.
- Blank 4: current `4:Moreover, speaking with native speakers is highly recommended.` -> suggested `3:D. Watching films with subtitles can also help a lot.`; confidence 0.85; Blank 4 follows 'When you listen to native speakers, you naturally absorb pronunciation and sentence patterns.' Option D about watching films with subtitles is a natural elaboration on listening and absorbing, while option E repeats the idea of speaking with native speakers already used in blank 3.

### seven_select-sp-高考-1ttodg6
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today's digital age, the internet has become an essential part of our daily lives. (1) However, it also brings various security risks that we must be aware of. One common threat
- Blank 3: current `2:Using the same password for all sites is a bad habit to avoid.` -> suggested `6:Instead, choose a phrase that is meaningful only to you.`; confidence 0.9; Option C breaks the positive flow from 'use strong, unique passwords' to 'a good password should contain...'; Option G directly advises creating a meaningful phrase, fitting the context.

### seven_select-sp-高考-1unv5wr
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, many people find themselves overwhelmed by endless requests from work, family, and friends. (1) However, constantly saying yes can lead to burnout and 
- Blank 2: current `6:Saying yes to everything may seem kind, but it often backfires.` -> suggested `5:The key is to communicate your decision clearly and kindly.`; confidence 0.9; Option G restates the previous sentence, disrupting the logical flow; Option F directly introduces the example that follows.
- Blank 3: current `5:The key is to communicate your decision clearly and kindly.` -> suggested `2:A polite refusal can actually strengthen your relationships.`; confidence 0.85; Option C logically connects the example to the advice about offering alternatives, while Option F is better placed earlier.
- Blank 4: current `2:A polite refusal can actually strengthen your relationships.` -> suggested `0:Many people believe that saying no is rude or selfish.`; confidence 0.8; Option A provides a contrast that leads into the positive statement about boundaries earning respect, improving coherence.

### seven_select-sp-高考-1vavipr
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, we are constantly surrounded by entertainment—smartphones, social media, and streaming services keep us occupied every second. (1) However, a growing n
- Blank 3: current `5:In fact, some studies show that boredom can even boost problem-solving skills.` -> suggested `1:These quiet moments actually help us connect ideas in new ways.`; confidence 0.85; Option B directly follows the idea of mental wandering and leads naturally to the contrast with constant stimulation, while F disrupts the flow.

### seven_select-sp-高考-1vg2560
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies being busy, learning to say no is a valuable skill. Many people struggle with this simple word because they fear disappointing others or missing out
- Blank 2: current `0:It is important to communicate your reasons clearly and firmly.` -> suggested `4:Learning to decline politely can improve your relationships in the long run.`; confidence 0.85; The example of refusing extra work directly supports the benefit of polite refusal for relationships, not generic advice about communicating reasons.

### seven_select-sp-高考-1wiyl7x
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our busy lives, we often overlook the impact of small gestures. (1) However, a simple act of kindness can brighten someone’s entire day. For instance, holding the door for a str
- Blank 5: current `0:A. We tend to think that only big actions can change the world.` -> suggested `4:E. Sometimes the smallest gesture leaves the deepest impression.`; confidence 0.95; Option A contradicts the passage's emphasis on small gestures; E aligns with the concluding thought.

### seven_select-sp-高考-1yc4yy8
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that a good memory is something you are born with, but research shows it can be trained. (1) In fact, our brain is like a muscle — the more you use it, the stro
- Blank 5: current `5:F. Therefore, it is better to study alone than in a group.` -> suggested `4:E. Exercise increases blood flow to the brain, which improves concentration and recall.`; confidence 0.95; The preceding sentence discusses physical activity boosting brain function, so the blank should elaborate on exercise, not introduce an unrelated topic about studying alone.

### seven_select-sp-高考-2quz80
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk. They see it as meaningless chatter that wastes time. (1) In fact, these brief exchanges can build bridges between strangers and c
- Blank 4: current `5:Instead, they prefer to dive straight into serious topics.` -> suggested `3:D. On the contrary, avoiding small talk might make you seem unfriendly.`; confidence 0.9; Option F lacks a clear referent for 'they' and 'Instead' does not logically follow the preceding sentence about discomfort with small talk; Option D provides a coherent contrast.

### seven_select-sp-高考-4fsmnp
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often overlook the impact of small acts of kindness. (1) However, these seemingly insignificant gestures can actually create a ripple effect that spreads far
- Blank 4: current `3:However, the effects of such deeds are often underestimated.` -> suggested `2:Witnessing kindness encourages others to act similarly.`; confidence 0.9; D introduces an underestimation idea that disrupts the logical flow from 'contagious' to 'inspire others'; C directly explains the mechanism.

### seven_select-sp-高考-6dyojt
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often glorifies being busy, learning to say "no" has become an essential skill for maintaining mental health. (1) Many people find themselves overwhelmed by endless
- Blank 3: current `1:People often fear that refusing a request will damage their relationships.` -> suggested `2:C. Instead, it communicates honesty and respect for both yourself and others.`; confidence 0.9; Blank 3 follows a negative statement about burnout; the next sentence should contrast with a positive effect of saying no. Option C provides that contrast and links to the following sentence about strengthening relationships, while Option B introduces an unsupported fear.
- Blank 4: current `2:Instead, it communicates honesty and respect for both yourself and others.` -> suggested `1:B. People often fear that refusing a request will damage their relationships.`; confidence 0.85; Blank 4 follows 'This simple word can actually strengthen relationships' and precedes an example that counters a common worry. Option B introduces that worry naturally, while Option C is a positive continuation that does not set up the example.

### seven_select-sp-高考-8uxcny
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning to say no is an essential skill in modern life. Many people feel pressured to agree to every request, fearing they might disappoint others or miss opportunities. (1) Howev
- Blank 2: current `3:Instead, they should learn to prioritize their own well-being.` -> suggested `1:B. Many people mistakenly believe that saying no is rude or selfish.`; confidence 0.85; Option D repeats the idea of prioritizing well-being already implied, while B introduces a contrasting misconception that fits the flow after 'setting boundaries is a sign of self-respect'.

### seven_select-sp-高考-aktvza
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our modern world, we are constantly surrounded by noise. From the buzz of smartphones to the chatter in crowded spaces, silence has become a rare commodity. (1) However, silence
- Blank 2: current `1:Silence can also be misunderstood as disinterest or anger.` -> suggested `3:This is why public speakers often use pauses to emphasize key points.`; confidence 0.85; The current option B introduces a negative aspect, but the context after blank 2 gives a positive example of silence encouraging sharing; D directly supports that example.
- Blank 4: current `4:Without silence, true reflection and understanding become difficult.` -> suggested `2:By doing so, we create space for empathy and deeper connection.`; confidence 0.9; C directly follows the idea of active listening and leads into the next sentence about stopping talking and listening; E is too general and breaks the flow.

### seven_select-sp-高考-av6dd6
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, many people think that speaking is the most important communication skill. However, listening is equally, if not more, crucial for building strong relation
- Blank 3: current `3:D. This is because our minds tend to wander when others speak.` -> suggested `6:G. Good listening requires patience and empathy.`; confidence 0.85; The contrast marker 'In contrast' requires a statement about good listening to oppose the preceding poor listening, and Option G fits that contrast naturally.
- Blank 4: current `1:B. Remember, listening is a skill that can be developed.` -> suggested `3:D. This is because our minds tend to wander when others speak.`; confidence 0.9; The statistic about remembering 25% is directly explained by Option D, creating a clear cause-effect link, while Option B is too general for this position.
- Blank 5: current `2:C. Many people prefer talking over listening in daily life.` -> suggested `1:B. Remember, listening is a skill that can be developed.`; confidence 0.8; The final sentence before the concluding line needs a motivational summary; Option B fits that role, while Option C introduces an irrelevant new topic.

### seven_select-sp-高考-ay9nty
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, viewing it as meaningless chatter. However, research shows that brief, casual conversations can significantly boost our sense of 
- Blank 3: current `2:Small talk can also improve our communication skills over time.` -> suggested `1:Many people avoid small talk because they find it boring.`; confidence 0.85; Option C introduces a new topic (improving skills) that disrupts the logical flow from example to explanation; Option B provides a contrast that fits the 'this is because' reasoning.

### seven_select-sp-高考-b0dtej
- Type: seven_select; exam: 高考; level: lv2
- Passage: When we walk through a forest, we often see trees as silent, solitary giants. (1) In reality, they are connected by a vast underground network of fungi, often called the 'Wood Wide
- Blank 4: current `4:However, not all trees participate equally in this sharing system.` -> suggested `2:C. This discovery has led to new methods in agricultural pest control.`; confidence 0.9; The current E introduces unequal participation, which is not supported by the preceding text about signaling and defensive chemicals; the following sentence 'This is not a conscious decision...' refers directly to the signaling behavior, not to unequal sharing. Option C is also irrelevant, but the blank needs a sentence that continues the signaling/defense theme. However, since the task is to review the suspected blank, the current key is clearly wrong and breaks coherence.
- Blank 5: current `2:This discovery has led to new methods in agricultural pest control.` -> suggested `4:E. However, not all trees participate equally in this sharing system.`; confidence 0.85; The current C about agricultural pest control is a sudden topic shift away from forest ecology and does not lead naturally to the concluding sentence about logging and conservation. Option E provides a nuanced detail about unequal participation, which logically precedes a call for careful conservation. The current key is clearly wrong.

### seven_select-sp-高考-b2egx8
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often find ourselves agreeing to requests that we would rather decline. Whether it’s a friend asking for a favor or a colleague requesting extra work, the pr
- Blank 2: current `3:It also helps you avoid taking on too many responsibilities.` -> suggested `2:C. By setting boundaries, you can focus on your own goals.`; confidence 0.9; Option D's 'also' lacks a clear prior referent, and C directly connects to the example of focusing on what truly matters.
- Blank 3: current `2:By setting boundaries, you can focus on your own goals.` -> suggested `3:D. It also helps you avoid taking on too many responsibilities.`; confidence 0.85; Option D logically continues the general benefit before introducing strategies, while C is better placed earlier.

### seven_select-sp-高考-bdv1nb
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced society, we are constantly surrounded by noise—from traffic, smartphones, and endless notifications. Yet, amidst this chaos, the ability to truly listen has b
- Blank 3: current `5:Without good listening, even the best intentions can be misunderstood.` -> suggested `2:Unfortunately, we often fail to listen because we are too busy with our own thoughts.`; confidence 0.85; The current sentence about misunderstandings does not logically connect to the following 'This is because...' which requires a preceding statement about a failure or lack of listening, not a consequence.

### seven_select-sp-高考-bim3h2
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that success comes from sudden bursts of inspiration or extraordinary talent. However, research shows that consistent daily habits play a far more important rol
- Blank 2: current `5:Great achievements are usually the result of small efforts repeated over time.` -> suggested `4:Similarly, a student who reviews just one page of notes daily will master a subject by the end of a term.`; confidence 0.9; Blank 2 follows a specific example (writer writing 300 words daily) and needs a parallel example; F is a general statement, while E provides a concrete parallel with 'Similarly'.
- Blank 5: current `4:Similarly, a student who reviews just one page of notes daily will master a subject by the end of a term.` -> suggested `5:Great achievements are usually the result of small efforts repeated over time.`; confidence 0.9; Blank 5 is the concluding sentence; F is a general summarizing statement that fits the conclusion, while E is a specific example that belongs earlier.

### seven_select-sp-高考-c1vo7j
- Type: seven_select; exam: 高考; level: lv2
- Passage: Small talk, often dismissed as meaningless chatter, actually plays a significant role in our social lives. (1) It serves as a social lubricant that helps people connect on a basic 
- Blank 1: current `0:It helps to build rapport and trust over time.` -> suggested `1:Many people underestimate the importance of small talk.`; confidence 0.85; The opening sentence says small talk is often dismissed as meaningless, so a sentence about underestimation fits better than one about building rapport over time, which is too specific for the opening.
- Blank 3: current `6:Listening actively is another crucial aspect of successful small talk.` -> suggested `0:It helps to build rapport and trust over time.`; confidence 0.8; The paragraph discusses small talk in professional settings and breaking the ice; 'build rapport and trust over time' logically extends that idea, while 'listening actively' is a new topic that fits better later.

### seven_select-sp-高考-efu6vg
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our daily lives, we often think that effective communication depends entirely on words. (1) However, silence can be just as powerful as speech in conveying meaning. For instance
- Blank 5: current `2:However, silence is not always welcome in every situation.` -> suggested `0:`; confidence 0.8; Option C introduces a negative note that disrupts the concluding positive advice about using silence to enhance skills. No other option fits well, but the current key is clearly wrong.

### seven_select-sp-高考-egt3b
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced work environment, many people spend hours sitting in conference rooms. However, a growing number of companies are encouraging employees to hold walking meetin
- Blank 2: current `0:This simple change can lead to more productive discussions.` -> suggested `4:E. They found that walking increased creative output by 60%.`; confidence 0.9; Blank 2 follows a claim about creativity; E provides specific study evidence, while A is a vague summary that fits later.
- Blank 3: current `4:They found that walking increased creative output by 60%.` -> suggested `0:A. This simple change can lead to more productive discussions.`; confidence 0.85; After the Steve Jobs example, A logically concludes the point; E is a study finding that belongs earlier.

### seven_select-sp-高考-evt358
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that constantly demands our attention and time, learning to say no is an essential skill for maintaining mental health and personal boundaries. (1) Many people find them
- Blank 2: current `6:Learning to say no does not mean you are being rude or uncooperative.` -> suggested `0:The ability to say no is actually a form of self-care.`; confidence 0.9; Option G is a defensive statement that does not logically follow the preceding sentence about burnout; Option A directly contrasts with burnout and introduces self-care, fitting the flow.

### seven_select-sp-高考-gy6rwb
- Type: seven_select; exam: 高考; level: lv2
- Passage: Life is full of unexpected twists and turns. Sometimes, we hold onto things that no longer serve us, simply because we are afraid of change. (1) However, learning to let go can be 
- Blank 4: current `4:By doing so, we free ourselves from the weight of the past.` -> suggested `2:Letting go of resentment opens the door to forgiveness and understanding.`; confidence 0.9; The preceding sentence discusses holding onto past conflicts in friendships; the suggested sentence directly addresses releasing resentment and forgiveness, providing a coherent and specific continuation. The current sentence 'By doing so...' lacks a clear antecedent for 'doing so' and is too generic in this context.

### seven_select-sp-高考-h8kjui
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people struggle with saying no, especially when they want to be helpful or avoid disappointing others. (1) However, constantly saying yes can lead to burnout and resentment. L
- Blank 2: current `3:Many people feel guilty when they say no to others.` -> suggested `1:Setting boundaries is not about being selfish but about self-respect.`; confidence 0.85; The current option about guilt does not logically connect the preceding sentence on learning to say no with the following example of a reasonable decline; option B provides a coherent thematic link about boundaries and self-respect.

### seven_select-sp-高考-hf04j9
- Type: seven_select; exam: 高考; level: lv2
- Passage: Sleep is essential for our physical and mental health, yet many people struggle to get enough quality rest. (1) However, there are several effective strategies that can help improv
- Blank 3: current `2:Activities like watching TV or playing video games can be too stimulating before bed.` -> suggested `5:For example, reading a book or listening to soft music can be helpful.`; confidence 0.95; The blank follows 'create a relaxing bedtime routine' and precedes examples of relaxing activities; the current option about stimulating activities contradicts the context.

### seven_select-sp-高考-hy5oxx
- Type: seven_select; exam: 高考; level: lv2
- Passage: The Internet has become an essential part of our daily lives, offering convenience and endless information. However, it also brings risks such as identity theft and cyberbullying. 
- Blank 1: current `0:Moreover, it is wise to update your passwords regularly and avoid using the same password for different accounts.` -> suggested `1:Therefore, it is important to take steps to protect yourself online.`; confidence 0.9; The passage needs a general introductory sentence after the risk statement before listing specific tips; the current option A is a specific tip that fits better later.

### seven_select-sp-高考-kvw0rq
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where constant chatter and digital noise dominate our daily lives, silence is often undervalued. (1) However, silence can be a powerful tool in communication, allowing f
- Blank 2: current `1:Silence can also serve as a sign of respect in certain professional settings.` -> suggested `3:Instead, they rush to fill every gap with words, fearing that silence might be seen as awkward.`; confidence 0.85; The current key introduces a new point about respect without a clear connector, while the suggested option directly contrasts the positive view of silence with a common negative reaction, fitting the flow better.

### seven_select-sp-高考-lu2nq3
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world where everyone seems eager to speak, the art of listening is often undervalued. (1) Yet, listening is not just about hearing words; it is about understanding emotions an
- Blank 3: current `2:Without listening, communication often breaks down quickly.` -> suggested `5:On the contrary, poor listening can lead to conflicts and misunderstandings.`; confidence 0.85; Option C is too abrupt and generic; Option F provides a contrastive transition and directly connects to the preceding benefits and following emphasis on attentive listening.

### seven_select-sp-高考-msk5nx
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, believing it to be a waste of time. (1) In fact, these brief exchanges can serve as the foundation for deeper relationships. (2) 
- Blank 5: current `3:Many find it difficult to start a conversation with strangers.` -> suggested `5:Avoiding small talk can lead to missed chances for friendship.`; confidence 0.85; The current sentence (D) introduces a new difficulty topic that does not logically conclude the paragraph; option F directly supports the concluding sentence about mastering small talk by highlighting consequences of avoidance.

### seven_select-sp-高考-n9sv9y
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many successful people attribute their achievements to a well-structured morning routine. (1) Without a consistent start to the day, it’s easy to feel rushed and unproductive. Rese
- Blank 2: current `1:Similarly, a consistent routine can help reduce anxiety and improve decision-making.` -> suggested `2:For instance, a 10-minute walk outside can boost creativity and mood.`; confidence 0.9; Blank 2 follows a general statement about the first hour and precedes examples; 'For instance' fits the exemplification flow, while 'Similarly' is a logical mismatch.

### seven_select-sp-高考-nm0a9u
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, communication often becomes a one-way street. Many people focus more on what they are going to say next than on truly hearing others. (1) This skill re
- Blank 1: current `6:However, truly effective listening goes beyond simply hearing sounds.` -> suggested `0:Active listening is a skill that can be learned and improved with practice.`; confidence 0.9; The next sentence refers to 'this skill', which requires an explicit antecedent of 'active listening'; 'effective listening' is too vague and not yet introduced.
- Blank 5: current `0:Active listening is a skill that can be learned and improved with practice.` -> suggested `6:However, truly effective listening goes beyond simply hearing sounds.`; confidence 0.85; Blank 5 is the concluding sentence; the current option is a generic introductory statement, while the suggested option provides a contrastive summary that fits the concluding flow.

### seven_select-sp-高考-o75xyw
- Type: seven_select; exam: 高考; level: lv2
- Passage: Do you often wake up feeling tired, even after a full night’s sleep? You are not alone. Many people struggle with poor sleep quality without knowing why. (1) In fact, the environme
- Blank 1: current `0:However, the real secret might be simpler than you expect: your bedroom environment.` -> suggested `4:Many people believe that sleep problems are caused by stress or diet.`; confidence 0.9; The passage sets up a common problem, then 'In fact' introduces a contrast. Option E provides the common belief that 'In fact' corrects, creating logical flow. Current option A lacks this contrast and feels abrupt.
- Blank 4: current `6:Thirdly, exercise regularly during the day to promote deeper sleep at night.` -> suggested `3:Also, avoid using electronic devices for at least an hour before bed.`; confidence 0.95; Blank 4 follows discussion of light and blue light from screens. Option D directly continues that topic, while current option G introduces exercise, breaking local coherence.

### seven_select-sp-高考-opp52v
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, it's easy to overlook the impact of small gestures. (1) However, research shows that even tiny acts of kindness can significantly boost both the giver's an
- Blank 5: current `6:Therefore, we should always wait for big opportunities to be kind.` -> suggested `-1:`; confidence 0.95; The current key contradicts the passage's central theme that small gestures matter, and no other option fits better.

### seven_select-sp-高考-pl87kk
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many successful people swear by their morning routines, and one practice that has gained significant popularity is writing 'morning pages.' This simple yet powerful habit involves 
- Blank 1: current `0:It is recommended to write them immediately after waking up.` -> suggested `2:This process helps to release emotional tension and mental blocks.`; confidence 0.9; Option A introduces a timing recommendation that breaks the logical flow; Option C directly connects to the idea of clearing mental clutter.
- Blank 2: current `2:This process helps to release emotional tension and mental blocks.` -> suggested `1:Many people report feeling more organized and less stressed after a few weeks.`; confidence 0.85; Option C is better placed earlier as a direct elaboration; Option B fits as a result/outcome after the explanation of the process.
- Blank 3: current `1:Many people report feeling more organized and less stressed after a few weeks.` -> suggested `0:It is recommended to write them immediately after waking up.`; confidence 0.8; Option B is better placed earlier as a general outcome; Option A fits as a practical tip before the beginner advice.
- Blank 5: current `5:The content does not need to be polished or meaningful.` -> suggested `3:However, consistency is more important than perfection in this practice.`; confidence 0.85; Option D is better placed earlier as a general principle; Option F is a more fitting final tip aligning with beginner advice and stream-of-consciousness.

### seven_select-sp-高考-po1isw
- Type: seven_select; exam: 高考; level: lv2
- Passage: In our fast-paced world, it's easy to overlook the impact of small gestures. (1) However, research shows that even tiny acts of kindness can significantly boost both the giver's an
- Blank 3: current `3:This is why schools encourage students to participate in community service.` -> suggested `1:These small actions often go unnoticed in daily life.`; confidence 0.85; The blank follows 'This chain reaction' which refers to the ripple effect, not school encouragement. Option B logically connects the overlooked small actions to the chain reaction.
- Blank 5: current `6:Even a simple smile can work wonders in breaking the ice.` -> suggested `4:It only takes a few seconds to make a positive impact on someone's life.`; confidence 0.8; The blank is the final sentence before the concluding 'So next time...'. Option E directly supports the idea that a small act can start something bigger, while G is less relevant to the conclusion.

### seven_select-sp-高考-qft8ef
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today’s fast-paced world, we are constantly surrounded by entertainment and information. From smartphones to streaming services, there is always something to keep us occupied. H
- Blank 2: current `1:Many people fear boredom and try to avoid it at all costs.` -> suggested `6:Yet, modern society often views boredom as something negative.`; confidence 0.9; Option B breaks the positive flow; Option G provides a logical contrast and leads into the example.
- Blank 4: current `6:Yet, modern society often views boredom as something negative.` -> suggested `1:Many people fear boredom and try to avoid it at all costs.`; confidence 0.85; Option G fits better earlier; Option B provides a natural contrast before the advice to embrace boredom.

### seven_select-sp-高考-r7zuc1
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people underestimate the value of small talk, considering it a waste of time. However, brief conversations about the weather or weekend plans can actually build social bonds. 
- Blank 2: current `3:It’s a low-risk way to practice social skills.` -> suggested `5:F. Such conversations can also open doors to unexpected opportunities.`; confidence 0.85; The example of a simple greeting leading to a genuine connection is best followed by an additional benefit like unexpected opportunities, not a statement about practicing social skills.
- Blank 3: current `5:Such conversations can also open doors to unexpected opportunities.` -> suggested `3:D. It’s a low-risk way to practice social skills.`; confidence 0.8; After describing small talk as a social lubricant easing awkwardness, 'low-risk way to practice social skills' is a more logical continuation than 'open doors to unexpected opportunities'.

### seven_select-sp-高考-t49qmk
- Type: seven_select; exam: 高考; level: lv2
- Passage: In a world that often equates busyness with importance, learning to say no has become an essential skill for maintaining mental health and personal boundaries. (1) Many people find
- Blank 1: current `1:Yet mastering this skill can dramatically improve your well-being.` -> suggested `3:Nevertheless, many people fear that refusing will damage their relationships.`; confidence 0.85; The passage first states the importance of saying no, then describes the problem of overcommitment. Option D provides a natural contrast explaining why people struggle, while Option B is prematurely positive.

### seven_select-sp-高考-vj5psw
- Type: seven_select; exam: 高考; level: lv2
- Passage: In today's fast-paced world, we are constantly surrounded by digital devices and endless entertainment. However, a growing number of psychologists argue that boredom might actually
- Blank 3: current `6:By doing so, you might discover that boredom opens the door to fresh perspectives.` -> suggested `2:C. In fact, some schools have started to include unstructured time in their schedules.`; confidence 0.85; G's 'By doing so' lacks antecedent; C provides a concrete real-world extension after the inventors example.
- Blank 4: current `2:In fact, some schools have started to include unstructured time in their schedules.` -> suggested `6:G. By doing so, you might discover that boredom opens the door to fresh perspectives.`; confidence 0.9; G directly follows 'try embracing the feeling' with 'By doing so', creating a coherent sequence.

### seven_select-sp-高考-vu2yed
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that achieving big goals requires dramatic changes. However, research in psychology suggests otherwise. (1) In fact, tiny adjustments in daily routines can lead
- Blank 3: current `0:Small habits are often overlooked because they seem insignificant at first.` -> suggested `4:This approach works because it lowers the barrier to starting.`; confidence 0.9; Option E directly explains why making the behavior easy works, while A introduces a new idea about being overlooked, breaking the logical flow.

### seven_select-sp-高考-vu9eg9
- Type: seven_select; exam: 高考; level: lv2
- Passage: Happiness is a universal goal, yet its definition varies from person to person. (1) In recent years, researchers have identified several key factors that contribute to a lasting se
- Blank 5: current `6:Finally, remember that happiness is not a destination but a journey.` -> suggested `5:Instead, we should learn to view difficulties as opportunities for growth.`; confidence 0.9; The preceding sentence discusses accepting negative emotions and building resilience; the suggested sentence directly continues that idea, while the current sentence is a generic conclusion that fits better at the end.

### seven_select-sp-高考-wq2wu4
- Type: seven_select; exam: 高考; level: lv2
- Passage: Mistakes are often seen as something to avoid, but they can actually be valuable learning tools. (1) In fact, many great discoveries and inventions were born from errors. For examp
- Blank 2: current `1:Instead of feeling ashamed, we should analyze what went wrong.` -> suggested `3:Similarly, in daily life, errors can teach us important lessons about patience and persistence.`; confidence 0.85; B is abrupt after the brain re-evaluation sentence; D's 'Similarly' logically extends the general benefit to daily life.
- Blank 3: current `3:Similarly, in daily life, errors can teach us important lessons about patience and persistence.` -> suggested `1:Instead of feeling ashamed, we should analyze what went wrong.`; confidence 0.8; D shifts to daily life, but B directly addresses the fear of mistakes and offers a constructive response, fitting the contrast with fearful students.

### seven_select-sp-高考-ydbym1
- Type: seven_select; exam: 高考; level: lv2
- Passage: Team sports have long been celebrated for their ability to bring people together. (1) For instance, a study found that students who played team sports reported higher levels of hap
- Blank 5: current `1:Moreover, participating in team sports helps develop important social skills.` -> suggested `0:A. Research shows that team sports can improve mental health significantly.`; confidence 0.9; B's 'Moreover' is additive and inappropriate for a concluding sentence; A is not ideal but less wrong than B. However, B is clearly wrong.

### seven_select-sp-高考-ydhl2w
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning to say no is a crucial skill in modern life, yet many people find it surprisingly difficult. (1) They fear disappointing others or damaging relationships. However, constan
- Blank 3: current `6:The key is to be firm but polite, without over-explaining.` -> suggested `5:F. Instead of a flat refusal, offer an alternative or explain your situation.`; confidence 0.9; The example directly illustrates offering an explanation, not just being firm and polite without over-explaining.

### seven_select-sp-高考-yknif9
- Type: seven_select; exam: 高考; level: lv2
- Passage: Many people believe that happiness comes from wealth, fame, or success. However, research has shown that true happiness often lies in simple things. (1) For example, spending time 
- Blank 5: current `6:Money is often considered the key to happiness.` -> suggested `-1:`; confidence 0.95; The passage ends with a call to appreciate what we have rather than chase material things; the current key contradicts this message and is ungrammatical in context.

### seven_select-sp-高考-zazeh7
- Type: seven_select; exam: 高考; level: lv2
- Passage: Learning a new language is often seen as a difficult task, but it doesn't have to be that way. (1) In fact, the most effective way is to immerse yourself in the language as much as
- Blank 1: current `0:A. Many people think that grammar is the most important part.` -> suggested `1:B. However, the key is to find a method that works for you.`; confidence 0.9; Option A introduces grammar, which is not supported by the following text about immersion; Option B provides a logical contrast and sets up the specific method.
- Blank 5: current `5:F. Reading newspapers aloud can improve your pronunciation.` -> suggested `4:E. Instead, celebrate small achievements along the way.`; confidence 0.85; Option F is a specific tip out of place in the concluding paragraph; Option E directly contrasts the marathon metaphor and fits the concluding advice.


## Ambiguous / Needs Human Review

### banked_cloze-bp-cet4-10qooc6
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `8:implementing`; suggested `4:temporary`; 'implementing such a break' is grammatically possible as a gerund subject, though less common; 'temporary such a break' is ungrammatical, but 'a temporary break' would require restructuring. Both options have issues, so the current key is not clearly wrong.

### banked_cloze-bp-cet4-14d35ui
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `4:maturity`; suggested `1:understanding`; 'maturity' is less idiomatic but not impossible; 'understanding' is a stronger fit for 'sign of' in this context.

### banked_cloze-bp-cet4-15t0z1l
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `1:ignorance`; suggested `8:weakness`; 'Out of ignorance' is a common collocation and can mean acting without knowledge, which fits a child touching a hot stove. 'Weakness' is less idiomatic here. Both are possible.

### banked_cloze-bp-cet4-15t5jmy
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `1:thought`; suggested `5:presence`; Both 'deep thought' and 'deep presence' are plausible; 'thought' is a common collocation, but 'presence' fits the meditation context. Neither is clearly wrong.

### banked_cloze-bp-cet4-160akbr
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `10:stability`; suggested `10:stability`; 'Stability' is grammatically acceptable but collocation is weak; no clearly better option among the choices.

### banked_cloze-bp-cet4-1765vkj
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `13:distraction`; suggested `3:stimulation`; Both 'distraction' and 'stimulation' fit the context; the key is not clearly wrong.
- Blank 3: current `10:random`; suggested `3:stimulation`; 'Random stimulation' and 'alternative stimulation' are both plausible; no clear error.

### banked_cloze-bp-cet4-1aoh8u7
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:conscious`; suggested `11:clear`; 'conscious break' can be interpreted as a deliberate, mindful break, which is acceptable in context; 'clear break' is also plausible but not clearly superior.

### banked_cloze-bp-cet4-1atu1lp
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `10:revive`; suggested `7:boost`; revive our brain's capacity is possible but slightly odd; 'boost' is more natural but not available; 'revive' is acceptable though not ideal

### banked_cloze-bp-cet4-1c767x
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `9:entertainment`; suggested `1:distractions`; 'entertainment' is acceptable, but 'distractions' more precisely fits the theme of filling spare moments with digital stimuli.

### banked_cloze-bp-cet4-1cn96uu
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `8:obstacles`; suggested `11:challenges`; Both 'obstacles' and 'challenges' fit semantically and grammatically; neither is clearly wrong.

### banked_cloze-bp-cet4-1cqu385
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `7:continuous`; suggested `14:reliable`; 'continuous support' is acceptable in context of ongoing government backing; both 'continuous' and 'reliable' are plausible.

### banked_cloze-bp-cet4-1dvfp1v
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `3:benefit`; suggested `12:improve`; 'benefit' can be used transitively (e.g., 'benefit our health') and is grammatically acceptable here, though 'improve' is also plausible.

### banked_cloze-bp-cet4-1ew8qwv
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 9: current `1:reverse`; suggested `11:abandon`; 'reverse this trend' is a common collocation and grammatically correct; 'abandon' is also possible but not clearly more correct. Both are acceptable.

### banked_cloze-bp-cet4-1i7nygy
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 9: current `8:recharge`; suggested `7:reconnect`; 'recharge our thoughts' is unusual but could be metaphorical; 'reconnect' is more idiomatic but both are possible.

### banked_cloze-bp-cet4-1k5467x
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `14:significant`; suggested `0:powerful`; 'significant state of awareness' is acceptable; both 'significant' and 'powerful' fit the context.

### banked_cloze-bp-cet4-1l68c2d
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `8:health`; suggested `7:energy`; Both 'mental health' and 'mental energy' are plausible; context supports either.
- Blank 4: current `9:effective`; suggested `5:meaningful`; 'Effective response' is acceptable; 'meaningful response' is also strong. Both fit.

### banked_cloze-bp-cet4-1lyuvwr
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `6:massive`; suggested `10:complex`; 'massive actions' is acceptable in contrast to small habits; 'complex' also fits but not clearly superior.

### banked_cloze-bp-cet4-1m809lv
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `0:admitted`; suggested `-1:`; 'Admitted' is grammatically possible though less natural; no clearly better option in the bank.
- Blank 6: current `1:relaxing`; suggested `8:relaxed`; Both 'while relaxing' and 'while relaxed' are acceptable; the intended meaning is not clearly one over the other.
- Blank 10: current `13:precious`; suggested `12:valuable`; Both 'precious' and 'valuable' fit; 'valuable' is more common but 'precious' is not clearly wrong.

### banked_cloze-bp-cet4-1mjhbbr
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:pressure`; suggested `1:anxiety`; Both 'pressure' and 'anxiety' fit the context; neither is clearly wrong.

### banked_cloze-bp-cet4-1ojqovd
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `11:prevent`; suggested `2:reduce`; 'Prevent misunderstandings' is grammatically correct but slightly strong; 'reduce' is a common collocation. Both are acceptable.

### banked_cloze-bp-cet4-1secwj6
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `14:enhance`; suggested `10:improve`; Both 'enhance' and 'improve' are natural with 'mental health'
- Blank 8: current `10:improve`; suggested `14:enhance`; Both 'improve concentration' and 'enhance concentration' are acceptable

### banked_cloze-bp-cet4-1tm2wa9
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `0:avoided`; suggested `8:ignored`; Both 'avoided' and 'ignored' are plausible past participles fitting 'something to be ___'.

### banked_cloze-bp-cet4-1u2ckm8
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `10:thought`; suggested `7:reflection`; Both 'deeper thought' and 'deeper reflection' are acceptable; 'thought' is not clearly wrong.

### banked_cloze-bp-cet4-1vjl43c
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:resolve`; suggested `11:engages`; 'resolve to put' is grammatically possible and the best available option; 'engages' would require a different structure.

### banked_cloze-bp-cet4-1w80xl3
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `3:promote`; suggested `13:enhance`; 'Promote' is acceptable and grammatical, though 'enhance' may be slightly more natural; both are plausible.

### banked_cloze-bp-cet4-5kd4aa
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `3:uninterrupted`; suggested `14:regular`; 'Uninterrupted' is possible but less natural; 'regular' (index 14) or 'optional' (index 5) could also fit, making the choice ambiguous.

### banked_cloze-bp-cet4-6d6zmz
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `7:grow`; suggested `7:grow`; 'grow into' is a common collocation and acceptable, though other options might also fit; not clearly wrong.
- Blank 10: current `3:lesson`; suggested `1:transformation`; 'lesson' is acceptable as a summary noun; 'transformation' is also possible but not clearly superior.

### banked_cloze-bp-cet4-6wnmqm
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `14:benefit`; suggested `:`; 'Environmental benefit' is a common phrase and acceptable here, though 'impact' or 'advantage' might be more precise.

### banked_cloze-bp-cet4-7bire7
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `8:awareness`; suggested `0:accidentally`; 'Awareness' is a plausible noun for the context of mindful technology use, and 'with greater awareness' is acceptable in English. The suggested 'accidentally' contradicts the intended meaning. The current key is not clearly wrong.

### banked_cloze-bp-cet4-97omvw
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 9: current `12:build`; suggested `12:build`; 'build a system' is acceptable, but 'design a system' (index 6) is also plausible. Both fit the context, making the choice ambiguous.

### banked_cloze-bp-cet4-aclnqz
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 4: current `0:refuse`; suggested `12:ignore`; 'Cannot refuse to do it' is grammatically possible but semantically odd; 'ignore' does not fit either. The intended word 'fail' is not an option, so the current key is acceptable but not ideal.
- Blank 10: current `4:accumulate`; suggested `5:grow`; 'Let it accumulate' is acceptable and idiomatic; 'grow' is also possible but not clearly superior. Both are grammatically correct and contextually plausible.

### banked_cloze-bp-cet4-eav1yg
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `12:productive`; suggested `2:valuable`; Both 'productive' and 'valuable' are grammatically and semantically acceptable; the passage supports either interpretation.
- Blank 5: current `9:stimuli`; suggested `5:distraction`; 'External stimuli' is a standard collocation and fits the context; 'distraction' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-he0pdi
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `5:approach`; suggested `1:method`; Both 'approach' and 'method' are acceptable here; the current key is not clearly wrong but not uniquely best.

### banked_cloze-bp-cet4-k6owls
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 2: current `14:serious`; suggested `2:negative`; 'serious problem' is a common collocation and fits the context; 'negative problem' is also possible but less natural. Both are acceptable.

### banked_cloze-bp-cet4-k9o4sb
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:concentration`; suggested `13:effort`; 'active concentration' is acceptable though slightly redundant; 'active effort' is also plausible.

### banked_cloze-bp-cet4-kneb7h
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `0:interrupted`; suggested `3:distracted`; Both 'interrupted' and 'distracted' are plausible; 'distracted' may be more natural but 'interrupted' is not clearly wrong.

### banked_cloze-bp-cet4-l4udoz
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `10:trivial`; suggested `7:ordinary`; 'trivial' can mean small or slight, not necessarily negative; the contrast with 'far from small' works. 'Ordinary' also fits but is not clearly better.
- Blank 8: current `7:ordinary`; suggested `10:trivial`; 'ordinary' fits the contrast with 'grand occasions' and is not repetitive if blank 3 remains 'trivial'. Both options are acceptable.

### banked_cloze-bp-cet4-lxi6sl
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `6:schedule`; suggested `0:avoid`; 'Schedule unstructured time' is grammatically possible and could mean 'plan', though 'avoid' fits the contrast better.

### banked_cloze-bp-cet4-n9pfc8
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `2:patient`; suggested `11:consistent`; Both 'patient' and 'consistent' are plausible; 'consistent' fits habit formation better, but 'patient' is not clearly wrong.

### banked_cloze-bp-cet4-oc0grf
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `2:dramatic`; suggested `3:significant`; 'dramatic event' is acceptable; the contrast with daily habits does not require 'significant' over 'dramatic'.
- Blank 9: current `4:quality`; suggested `9:minor`; 'quality of the books' is grammatically and semantically acceptable; 'minor' is possible but not clearly better.

### banked_cloze-bp-cet4-qfelda
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 8: current `1:maximize`; suggested `11:expand`; 'maximize' is acceptable but 'expand' collocates more naturally with 'benefits'; both are possible, so the current key should not be changed.

### banked_cloze-bp-cet4-t123f2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 5: current `6:tolerate`; suggested `0:ignore`; 'Tolerate with silence' is ungrammatical; 'tolerate silence' would be correct but the text has 'with'. No option perfectly fits; 'tolerate' is problematic but 'ignore' also does not fit the structure. The blank is ambiguous.

### banked_cloze-bp-cet4-v35ol
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `8:value`; suggested `7:peace`; 'value of silence' is grammatically correct and thematically plausible; 'peace of silence' is also strong but not clearly superior.
- Blank 10: current `7:peace`; suggested `9:relaxation`; 'sense of peace' is a common collocation and fits the context; 'sense of relaxation' is also natural but not clearly more correct.

### banked_cloze-bp-cet4-w2yyp2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 10: current `7:environmental`; suggested `3:rewarding`; 'environmental' can be interpreted as an adjective parallel to 'personal', describing a type of reward (e.g., environmental benefits), and is not clearly ungrammatical; 'rewarding' is also plausible but not uniquely correct.

### banked_cloze-bp-cet4-wcckm1
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 1: current `10:valued`; suggested `12:ignored`; 'valued' can be interpreted as 'regarded' (e.g., 'valued as negative') in a neutral sense, and the passage does not explicitly require a negative verb; 'ignored' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-ydcsjn
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 7: current `10:feature`; suggested `12:creative`; 'feature' can be interpreted as a notable aspect or characteristic of urban gardening, which fits the context; 'creative' is also plausible but not clearly more correct.

### banked_cloze-bp-cet4-yzfov2
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 3: current `7:effective`; suggested `2:reliable`; Both 'effective' and 'reliable' are plausible; 'surprisingly effective' is also a common collocation.
- Blank 10: current `2:reliable`; suggested `7:effective`; Both 'reliable tool' and 'effective tool' are natural; the context does not clearly favor one over the other.

### banked_cloze-bp-cet4-z6cfo
- Type: banked_cloze; exam: CET-4; level: lv3
- Blank 6: current `10:trust`; suggested `10:trust`; 'build trust' is acceptable, but 'build connection' is also plausible; both fit.

### banked_cloze-bp-cet6-12na6oi
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `10:widen`; suggested `3:undermine`; Both 'widen' and 'undermine' are plausible; 'widen' is more direct for inequality, but 'undermine' could also fit the context of social inequality.

### banked_cloze-bp-cet6-13cptaw
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `7:neglect`; suggested `0:overlooked`; 'Neglect' is a base verb and fits grammatically; 'overlook' is more precise but both are acceptable.

### banked_cloze-bp-cet6-13outwr
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 4: current `7:emphasized`; suggested `3:emphasize`; Both 'emphasized' (past tense) and 'emphasize' (present tense) are grammatically acceptable; the passage uses present tense for general findings but past tense for specific study actions, making either possible.

### banked_cloze-bp-cet6-152roc0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `0:contest`; suggested `1:constant`; 'contest' is grammatically a verb but semantically weak; 'constant' is an adjective and cannot fill the verb slot. No ideal verb is available, making the blank problematic but not clearly wrong.

### banked_cloze-bp-cet6-166458o
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 4: current `9:integrates`; suggested `12:combines`; Both 'integrates' and 'combines' are grammatically and semantically acceptable; 'combines ... with' is more natural but 'integrates' is not incorrect.

### banked_cloze-bp-cet6-16x645e
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `7:simplicity`; suggested `7:simplicity`; The passage's final sentence contrasts reducing screen time with consciously engaging natural abilities; 'simplicity' can be interpreted as a minimalist lifestyle that includes such engagement, making it acceptable though not ideal.

### banked_cloze-bp-cet6-19j1m0u
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `3:clear`; suggested `9:rigid`; 'clear boundaries' is a common and acceptable collocation; 'rigid' is also possible but not clearly superior in this context of mindful consumption.

### banked_cloze-bp-cet6-1btp2m4
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `3:cultivating`; suggested `10:foster`; 'cultivating' is a gerund and can follow 'and' after 'breaking tasks', but 'foster' (verb base form) would also fit grammatically and collocationally. Both are acceptable, but 'foster' is more concise and common in such advice contexts.

### banked_cloze-bp-cet6-1bzxs2i
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `7:moderate`; suggested `3:balanced`; 'moderate integration' is grammatically and semantically acceptable; 'balanced' is also plausible but not clearly superior, and using it again may cause repetition.

### banked_cloze-bp-cet6-1d3ne67
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `4:prevalence`; suggested `5:adoption`; Both 'prevalence' and 'adoption' are grammatically correct and contextually plausible.
- Blank 4: current `9:presence`; suggested `4:prevalence`; Both 'presence' and 'prevalence' are grammatically correct; 'prevalence' is a stronger collocation but not uniquely correct.
- Blank 10: current `3:governance`; suggested `7:alignment`; Both 'governance' and 'alignment' are grammatically valid; 'alignment' echoes earlier phrasing but 'governance' is also acceptable.

### banked_cloze-bp-cet6-1d4umg2
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `1:enhance`; suggested `8:foster`; Both 'enhance' and 'foster' are grammatically correct and plausible; 'foster' is slightly more idiomatic for 'balance', but 'enhance' is also acceptable.

### banked_cloze-bp-cet6-1f2pl85
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `14:overrated`; suggested `5:scarcity`; 'overrated' is unusual but could be interpreted as 'convenience is overrated as a commodity'; 'scarcity' also fits but not clearly more correct.

### banked_cloze-bp-cet6-1jzx21x
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `10:tangible`; suggested `8:harmful`; Both 'tangible' and 'harmful' are grammatically and semantically possible; the following examples support 'harmful' but 'tangible' is not incorrect.
- Blank 8: current `7:implement`; suggested `13:adopt`; Both 'implement' and 'adopt' are acceptable with 'programs'; 'implement' emphasizes execution, 'adopt' emphasizes initiation.

### banked_cloze-bp-cet6-1lcyqvs
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `4:attention`; suggested `9:paradox`; 'gained considerable attention' is a natural collocation and fits the context; 'paradox' is also plausible given the ironic twist, but not clearly more correct.

### banked_cloze-bp-cet6-1nv5sy0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `10:focused`; suggested `2:balanced`; Both 'focused' and 'balanced' are plausible for 'state of mind'; 'balanced' is more natural but 'focused' is not wrong

### banked_cloze-bp-cet6-1qgdu3n
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `10:exacerbate`; suggested `10:`; 'exacerbate respiratory problems' is acceptable, and no better option is available in the bank

### banked_cloze-bp-cet6-1rtl9u9
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `6:exhaustingly`; suggested `5:temporarily`; 'exhaustingly' is a valid adverb modifying 'stressful', though 'temporarily' may be more idiomatic; both are grammatically acceptable.
- Blank 6: current `9:ambiguity`; suggested `11:burden`; 'legal ambiguity' is possible but less coherent with fines/deportation; 'burden' fits the consequence context, but ambiguity is not clearly wrong.

### banked_cloze-bp-cet6-1sa02t9
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `12:optimize`; suggested `5:replicate`; Both 'optimize' and 'replicate' are grammatically and semantically acceptable; 'replicate' is more natural but not clearly required.

### banked_cloze-bp-cet6-1suaofo
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `8:driven`; suggested `9:transfer`; 'driven' can mean 'carry' or 'propel' in context of currents moving heat; both 'driven' and 'transfer' are possible.

### banked_cloze-bp-cet6-1u733e4
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `8:serenity`; suggested `6:tranquility`; Both 'serenity' and 'tranquility' are acceptable nouns meaning calm; 'crave serenity from notifications' is idiomatic enough, and the difference is stylistic, not grammatical.
- Blank 7: current `6:tranquility`; suggested `8:serenity`; Both 'tranquility' and 'serenity' fit the collocation 'heightened sense of ___ and creativity'; neither is clearly wrong, and the choice is subjective.

### banked_cloze-bp-cet6-1uudhgo
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `8:rigorous`; suggested `8:rigorous`; Both 'rigorous approach' and 'sustained approach' are plausible
- Blank 6: current `9:plausible`; suggested `9:plausible`; 'plausible in theory' is fine; 'vague in theory' also possible but context slightly favors 'plausible'

### banked_cloze-bp-cet6-1w7zzgz
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `9:essence`; suggested `-1:`; 'essence' is acceptable but not the most natural; no better option in the bank.

### banked_cloze-bp-cet6-23zgh3
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 8: current `4:paradox`; suggested `10:chaos`; Neither 'paradox' nor 'chaos' is a perfect fit; 'paradox' can be stretched to mean a contradictory situation, and 'chaos' is also weak. The intended word is likely not in the options, making the current key acceptable as the least bad choice.

### banked_cloze-bp-cet6-4fc191
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `13:appropriate`; suggested `2:sensitive`; Both 'appropriate' and 'sensitive' are plausible in context; current key is acceptable.

### banked_cloze-bp-cet6-83l5o4
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `10:aspire`; suggested `10:aspire`; 'aspire to unplug' is grammatically correct and semantically plausible, though not the most natural; no clearly better option in the bank.
- Blank 3: current `14:paradoxes`; suggested `14:paradoxes`; 'fraught with paradoxes' is acceptable; no clearly better option available.

### banked_cloze-bp-cet6-a318p1
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 7: current `12:demanding`; suggested `11:relaxing`; Both 'demanding' and 'relaxing' could fit: phone calls/meetings can be more demanding than online chats, or more relaxing depending on perspective; context is not decisive.

### banked_cloze-bp-cet6-blqr9w
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 9: current `2:restore`; suggested `14:foster`; 'restore a sense of control' is acceptable because the context implies regaining control lost to digital overload; 'foster' is also plausible but not clearly superior.

### banked_cloze-bp-cet6-fdg57b
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `12:temporary`; suggested `-1:`; 'temporary employment benefits' is acceptable as benefits that are not permanent, fitting the context of gig workers lacking long-term benefits.
- Blank 6: current `2:vulnerability`; suggested `-1:`; 'vulnerability of data privacy' is slightly awkward but can be interpreted as the susceptibility of data privacy to breaches; no clearly better option available.

### banked_cloze-bp-cet6-fnzn4h
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `11:underestimated`; suggested `2:overlooked`; Both 'underestimated' and 'overlooked' are grammatically correct and semantically plausible; 'overlooked' is slightly more natural but not clearly superior.
- Blank 5: current `9:dilemma`; suggested `5:paradox`; Both 'dilemma' and 'paradox' fit the context; 'paradox' may be slightly more precise but the current key is acceptable.

### banked_cloze-bp-cet6-g7kmig
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `10:consequence`; suggested `0:outcome`; Both 'consequence' and 'outcome' are grammatically possible; 'consequence' fits the negative tone slightly better, but 'outcome' is not clearly wrong.

### banked_cloze-bp-cet6-h3xw34
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `10:presence`; suggested `6:imbalanced`; 'presence of biased data' is grammatically correct and semantically plausible; the passage later uses 'imbalanced training datasets' but that does not force the same word here. Both 'presence' and 'imbalanced' are acceptable.

### banked_cloze-bp-cet6-i7kf9s
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `0:reluctant`; suggested `-1:`; 'reluctant' can be used as an adjective after 'are' implied; the blank may be part of a reduced relative clause, making it acceptable.

### banked_cloze-bp-cet6-id0vi
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 8: current `5:texture`; suggested `13:fabric`; Both 'texture of lived experience' and 'fabric of lived experience' are acceptable metaphors; the current key is not clearly wrong.

### banked_cloze-bp-cet6-ieu49r
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 3: current `7:limited`; suggested `4:exerted`; 'Limited' can be a past participle (e.g., 'have limited tasks'), so it is grammatically acceptable; meaning is plausible.

### banked_cloze-bp-cet6-ifo4q0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `10:restore`; suggested `12:enhance`; 'restore' can imply returning to a natural state of mental clarity, which is plausible in a context of reducing digital overload; 'enhance' is also possible but not clearly superior.

### banked_cloze-bp-cet6-j07w1s
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 4: current `12:worry`; suggested `9:advocate`; 'worry that' is acceptable though less formal; 'advocate' fits the argumentative context but 'worry' is not clearly wrong.
- Blank 6: current `0:accountability`; suggested `6:fairness`; 'accountability' is acceptable and not clearly wrong; 'fairness' would be redundant with previous sentence.
- Blank 9: current `14:enhanced`; suggested `3:significant`; 'enhanced efficiency' is grammatically acceptable; 'significant efficiency' is less idiomatic. Not clearly wrong.

### banked_cloze-bp-cet6-j2o1mh
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `11:addicted`; suggested `2:accessible`; 'remain addicted' is grammatically possible but 'remain accessible' (i.e., socially reachable) fits the context of social pressure better; both are acceptable but 'accessible' is more coherent.

### banked_cloze-bp-cet6-j68n7f
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `4:burst`; suggested `4:burst`; 'a burst of anxiety' is acceptable and commonly used; the context does not clearly rule out a sudden onset, and no clearly better alternative exists in the bank.

### banked_cloze-bp-cet6-jqunmu
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `8:promotes`; suggested `9:integrates`; 'promotes intentional use' is acceptable; the lifestyle advocates for intentional use, so both 'promotes' and 'integrates' are plausible.

### banked_cloze-bp-cet6-mbcf6n
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 6: current `10:strict`; suggested `2:relaxed`; Both 'strict' and 'relaxed' could fit: 'strict boundaries' is a common collocation and the passage does not explicitly reject strictness; the suggested 'relaxed' also fits the mindful approach, making the choice ambiguous.

### banked_cloze-bp-cet6-mcvz40
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `11:deliberately`; suggested `5:excessive`; 'Deliberately reducing' is grammatically correct and contextually plausible; 'excessive' would not fit before 'reducing'.

### banked_cloze-bp-cet6-n60rgv
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 10: current `5:challenge`; suggested `13:necessity`; Both 'technical challenge' and 'technical necessity' are plausible; the passage presents the transition as difficult (challenge) but also as required (necessity).

### banked_cloze-bp-cet6-ng1zcd
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `14:impacts`; suggested `-1:`; 'impacts' is natural for economic consequences, but 'merits' could also fit semantically; both are plausible.

### banked_cloze-bp-cet6-oj0k7s
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 7: current `14:enthusiasm`; suggested `14:`; 'enthusiasm' can be interpreted as the enthusiasm for digital minimalism, which may be short-lived; the sentence is ambiguous but not clearly ungrammatical.

### banked_cloze-bp-cet6-p56twp
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 5: current `9:persisted`; suggested `7:resists`; 'Persisted' is intransitive and would require 'in', but 'resists' is transitive and fits grammatically; however, 'persisted' might be accepted informally, making both possible.

### banked_cloze-bp-cet6-qvmnje
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `5:attention`; suggested `11:prevalence`; 'gained considerable attention' is a common and acceptable collocation; 'prevalence' is also plausible but not clearly required.

### banked_cloze-bp-cet6-t3ysmy
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 8: current `8:scalability`; suggested `0:support`; Both 'scalability' and 'support' can fit; 'support' is more natural with financial commitment but 'scalability' is not impossible.

### banked_cloze-bp-cet6-w3i3c2
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `14:confront`; suggested `0:counter`; 'confront users with content' is somewhat unusual but can be interpreted as 'present users with content they must face'; 'counter' is not a clear improvement. The intended meaning is likely 'supply' or 'present', but no perfect option exists. Thus, the current key is not clearly wrong.

### banked_cloze-bp-cet6-wm8zs0
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `3:escape`; suggested `6:abstinence`; 'periods of escape from technology' is acceptable; 'abstinence' is more precise but not uniquely correct
- Blank 8: current `6:abstinence`; suggested `3:escape`; 'sudden abstinence' is grammatically and semantically acceptable; 'escape' is also plausible, but not clearly better

### banked_cloze-bp-cet6-xn3psd
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 1: current `9:paradox`; suggested `2:dilemma`; 'paradox' can also fit the context of a contradictory situation; both are plausible.

### banked_cloze-bp-cet6-y5915z
- Type: banked_cloze; exam: CET-6; level: lv4
- Blank 2: current `9:deliberate`; suggested `12:excessive`; Both 'deliberate reduction' and 'excessive reduction' are grammatically and semantically plausible; the current key is acceptable.
- Blank 6: current `14:persistent`; suggested `12:excessive`; Both 'persistent distraction' and 'excessive distraction' fit; the current key is not clearly wrong.

### seven_select-sp-kaoyan-10pripf
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `3:Yet the very structure of digital minimalism can paradoxically create new forms of isolation.`; suggested `4:Such serendipity is difficult to replicate through deliberate online networking.`; Both D and E can fit; D's paradox about isolation follows naturally from the over-censoring idea, while E's reference to serendipity also connects to the preceding loss of informal exchanges.
- Blank 5: current `4:Such serendipity is difficult to replicate through deliberate online networking.`; suggested `3:Yet the very structure of digital minimalism can paradoxically create new forms of isolation.`; Both E and D are plausible as a concluding remark; E's comment on serendipity can serve as a summary, and D's paradox also works as a final negative consequence.

### seven_select-sp-kaoyan-10zdhmd
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 5: current `2:Studies indicate that frequent task-switching can reduce overall productivity by as much as 40%.`; suggested `6:Such addictive patterns make it increasingly difficult to disengage from the digital environment.`; Both C and G are plausible: C's task-switching is related to the preceding dopamine cycle, and G's addictive patterns also connect; the passage does not force a single correct choice.

### seven_select-sp-kaoyan-11589wz
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 1: current `1:Digital technologies have made it easier for anyone to publish and distribute content online.`; suggested `5:The traditional gatekeeping role of journals is therefore being steadily eroded.`; Both B and F can fit: B introduces the digital shift generally, while F concludes the erosion of gatekeeping; the paragraph allows either.
- Blank 4: current `5:The traditional gatekeeping role of journals is therefore being steadily eroded.`; suggested `1:Digital technologies have made it easier for anyone to publish and distribute content online.`; F about gatekeeping is not clearly out of place; it can serve as a broader conclusion after the debate. B also fits but not uniquely. Both are plausible.

### seven_select-sp-kaoyan-1242wky
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `5:This perspective, however, overlooks the fact that not everyone can afford to opt out of the digital economy.`; suggested `3:D. Many people find it impossible to maintain a balanced digital diet without external support.`; Option F fits as a transitional critique of the previous perspective, and the passage does not clearly require D; both are plausible.

### seven_select-sp-kaoyan-12e4w1y
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `4:Critics also point out that algorithmic systems lack the empathy needed for nuanced human contexts.`; suggested `1:Without proper oversight, these feedback loops can escalate into serious social harms.`; E is acceptable as a general criticism, but B's 'feedback loops' directly echoes the predictive policing example's self-reinforcing cycle, making it a stronger local fit. However, E is not clearly wrong.

### seven_select-sp-kaoyan-12os50s
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `5:Those who choose to disconnect may also face practical inconveniences, such as difficulty coordinating group activities.`; suggested `2:C. Many people find it difficult to maintain a complete digital detox while still meeting work and family obligations.`; Both F and C could fit: F extends the idea of professional drawbacks (practical inconveniences), while C also relates to work obligations. The passage does not clearly rule out F.

### seven_select-sp-kaoyan-12resji
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `1:The constant flow of notifications and the pressure to remain ‘always on’ have been linked to increased rates of anxiety and depression.`; suggested `0:A. Employees, in turn, feel compelled to respond to messages at all hours, blurring the line between being ‘at work’ and ‘off duty.’`; Both B and A are plausible: B directly follows the mention of collaborative platforms and techno-stress, while A continues the cause-effect from organizational encouragement. The current key is not clearly wrong.
- Blank 4: current `0:Employees, in turn, feel compelled to respond to messages at all hours, blurring the line between being ‘at work’ and ‘off duty.’`; suggested `1:B. The constant flow of notifications and the pressure to remain ‘always on’ have been linked to increased rates of anxiety and depression.`; A fits as a consequence of fragmented attention, but B also fits as a further elaboration on the effects of constant connectivity. The current key is acceptable.

### seven_select-sp-kaoyan-131dngz
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `4:This phenomenon, often termed the 'paradox of choice', has profound implications for how businesses design their product offerings.`; suggested `2:C. Consequently, many consumers now actively seek out brands that offer streamlined product lines.`; The current key E defines the paradox of choice, which logically follows the jam study example; the suggested C is also plausible but less direct.
- Blank 4: current `3:To illustrate, a well-known electronics retailer discovered that reducing the number of models on display increased sales by 15%.`; suggested `4:E. This phenomenon, often termed the 'paradox of choice', has profound implications for how businesses design their product offerings.`; The current key D provides an illustration, which fits after the general statement; the suggested E could also fit but is not clearly superior.
- Blank 5: current `2:Consequently, many consumers now actively seek out brands that offer streamlined product lines.`; suggested `3:D. To illustrate, a well-known electronics retailer discovered that reducing the number of models on display increased sales by 15%.`; The current key C is a logical consequence of the preceding sentence; the suggested D is also plausible as an illustration, but neither is clearly wrong.

### seven_select-sp-kaoyan-14mq310
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `4:This phenomenon is particularly pronounced among professionals who rely on digital tools for work.`; suggested `2:Social media algorithms are designed to exploit human psychological vulnerabilities.`; Option E ('This phenomenon is particularly pronounced among professionals...') fits as a specific example of the struggle mentioned in the previous sentence. Option C could also fit by explaining why withdrawal causes stress, but the current key is not clearly wrong. Both are plausible, making the choice ambiguous.

### seven_select-sp-kaoyan-152kvhv
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `4:Nevertheless, advocates maintain that even partial implementation can yield significant improvements in focus and life satisfaction.`; suggested `6:However, the movement has also faced accusations of being a privilege reserved for those with flexible schedules and stable incomes.`; After the critics' balanced approach, both E (advocates' counter) and G (further criticism) are plausible; the choice is not uniquely best.

### seven_select-sp-kaoyan-15f5dys
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `2:Water scarcity is already a critical issue in many cities around the world.`; suggested `5:Tree roots can also damage underground pipes and building foundations over time.`; The current option C is a general statement about water scarcity, which could be seen as a lead-in to the specific water strain mentioned, but the suggested F offers a parallel downside. Both are plausible; the context does not clearly rule out C.
- Blank 4: current `5:Tree roots can also damage underground pipes and building foundations over time.`; suggested `2:Water scarcity is already a critical issue in many cities around the world.`; The current option F introduces a new downside (roots) that fits the 'Additionally' structure, while the suggested C would repeat the water theme from blank 3. However, the passage could logically place a general water statement here as a transition. Both are possible.

### seven_select-sp-kaoyan-15qwb1x
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 2: current `2:However, critics argue that digital minimalism is a privilege not accessible to everyone.`; suggested `4:Adopting such a lifestyle requires a deliberate evaluation of one's digital habits.`; Both options could fit: the current option C introduces a critical perspective that is plausible after stating the paradox, while the suggested option E continues the call to action. The passage does not clearly rule out either.

### seven_select-sp-kaoyan-15wumdp
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 2: current `3:Some experts even argue that digital minimalism may exacerbate existing social inequalities.`; suggested `4:This phenomenon is particularly pronounced among young adults who rely heavily on social media for social validation.`; Both D and E can fit: D introduces a new but relevant point about inequalities, while E directly refers to the preceding phenomenon; the passage allows either.
- Blank 4: current `4:This phenomenon is particularly pronounced among young adults who rely heavily on social media for social validation.`; suggested `3:Some experts even argue that digital minimalism may exacerbate existing social inequalities.`; Both E and D can fit: E elaborates on the preceding finding about young adults, while D offers a contrasting expert view; the flow is not clearly broken by either.

### seven_select-sp-kaoyan-16jmsus
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 2: current `0:A. Applicants often feel frustrated when they receive no explanation for automated rejections.`; suggested `5:F. Even when bias is identified, correcting it can be technically challenging and costly.`; Option A fits the context of opacity and lack of explanation, but Option F also logically follows the discussion of bias. Both are plausible.
- Blank 3: current `5:F. Even when bias is identified, correcting it can be technically challenging and costly.`; suggested `0:A. Applicants often feel frustrated when they receive no explanation for automated rejections.`; Option F about correcting bias can also follow the opacity sentence, and Option A about frustration fits but is not uniquely correct. Both are acceptable.

### seven_select-sp-kaoyan-16srgy9
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 2: current `0:Instead of owning a car, many urban dwellers now subscribe to short-term rental services for occasional trips.`; suggested `6:By contrast, traditional business models rely on mass production and long-term customer ownership.`; Option A is a specific example that fits after the general statement and before 'For instance', but G also provides a plausible contrast; both are acceptable.
- Blank 4: current `3:This phenomenon has sparked heated debates among economists about its impact on traditional industries.`; suggested `1:Critics often overlook the fact that these platforms create flexible job opportunities for millions of gig workers.`; Option D is a general statement that fits, but B also provides a specific counterpoint to critics; both are plausible in context.

### seven_select-sp-kaoyan-173g7gn
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `2:Critics argue that the true solution lies in systemic change rather than individual abstinence.`; suggested `3:However, the movement has also sparked a backlash from those who see it as impractical or elitist.`; The current key (C) can be read as the critics' proposal after the example of structural dependencies, but the suggested D also fits as a transition introducing the backlash. Both are plausible, so the current key is not clearly wrong.

### seven_select-sp-kaoyan-194s4a8
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 2: current `1:Studies show that constant connectivity reshapes neural pathways, making withdrawal symptoms a real phenomenon.`; suggested `4:Nevertheless, the real test lies in maintaining this discipline when work or social life exerts pressure.`; Option B provides a general scientific explanation that could support the paradox, while Option E introduces a challenge that also fits the context. Both are plausible.
- Blank 3: current `2:Interestingly, those who succeed often report an initial period of discomfort followed by a profound sense of freedom.`; suggested `1:Studies show that constant connectivity reshapes neural pathways, making withdrawal symptoms a real phenomenon.`; Option C describes a positive outcome after discomfort, which could contrast with the following negative examples, while Option B explains the psychological basis. Both are defensible.
- Blank 4: current `3:Many people mistake digital minimalism for a complete rejection of technology, which is a common misconception.`; suggested `2:Interestingly, those who succeed often report an initial period of discomfort followed by a profound sense of freedom.`; Option D addresses a misconception that could logically follow the negative examples, while Option C offers a positive contrast. Both fit the flow.
- Blank 5: current `4:Nevertheless, the real test lies in maintaining this discipline when work or social life exerts pressure.`; suggested `3:Many people mistake digital minimalism for a complete rejection of technology, which is a common misconception.`; Option E introduces a challenge that could be seen as a natural continuation, while Option D clarifies a misconception before the conclusion. Both are reasonable.

### seven_select-sp-kaoyan-196lope
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `4:Instead, they often leave individuals feeling drained and disconnected.`; suggested `5:F. This shift can lead to a decline in the depth of emotional bonds between people.`; Both E and F could follow the irony statement; E's 'they' lacks a clear plural antecedent, but E is not clearly unacceptable.

### seven_select-sp-kaoyan-1cvvqk
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `5:These findings challenge the assumption that digital minimalism is universally beneficial.`; suggested `2:Moreover, schools in affluent districts have started implementing phone-free policies, widening the educational gap.`; The current key 'These findings' could refer to the studies mentioned in the previous sentence, making it acceptable; the suggested option also fits but is not clearly superior.

### seven_select-sp-kaoyan-1drppke
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 3: current `2:Adherents recommend a gradual, rather than abrupt, transition to a less digital lifestyle.`; suggested `6:The movement's core principle is to align technology use with personal values.`; Option C (gradual transition) is not contradicted by the following text about setting boundaries; both could fit. Option G is also plausible but not clearly superior.

### seven_select-sp-kaoyan-1empwbv
- Type: seven_select; exam: KAOYAN; level: lv5
- Blank 4: current `4:Therefore, a one-size-fits-all approach to digital minimalism may be both unrealistic and counterproductive.`; suggested `2:Some studies even suggest that moderate, intentional use of digital tools can enhance rather than harm well-being.`; Both E and C could fit; E directly concludes the preceding point, but C could serve as supporting detail before the conclusion. Current key is acceptable.

Additional ambiguous rows omitted from Markdown: 253. See JSON report.

## Shape Issues

No structural issues found.

## AI Errors

No AI/API errors.

## Notes

- Confirmed wrong requires two passes: pass 1 flags a blank, pass 2 confirms it.
- Ambiguous means the item should be reviewed by a human before changing the answer key.
- The script intentionally does not modify Supabase.
