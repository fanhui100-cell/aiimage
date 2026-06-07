-- ============================================================
-- LexiOcean Phase 6B: Core Dictionary Seed
-- ============================================================
-- Run AFTER phase-6a-dictionary-pronunciation-schema.sql.
-- IDEMPOTENT: uses DELETE + INSERT — safe to re-run.
-- DELETE cascades to all related tables automatically.
--
-- COMPLIANCE NOTE:
--   All content is original educational material for LexiOcean.
--   No commercial dictionary text. No pirated exam word lists.
--   source_type = 'original' for all rows.
-- ============================================================

-- Step 1: Remove any existing seed entries (cascade cleans related tables)
DELETE FROM dictionary_words WHERE id IN (
  'accept','achieve','active','communicate','create','decide','describe','discover',
  'accurate','adapt','appreciate','approach','aware','capable','compare','confident',
  'consider','contribute','demonstrate','effective','explore','flexible','improve','reduce',
  'accomplish','acknowledge','analyze','anticipate','assess','clarify','collaborate',
  'consistent','construct','distinguish','elaborate','emphasize','enhance','evolve','expand',
  'identify','influence','justify','maintain','significant','strengthen','transform',
  'abstract','advocate','coherent','comprehensive','constitute','contradict','conventional',
  'fundamental','illuminate','implement','perceive','phenomenon','relevant','subtle'
);

-- ────────────────────────────────────────────────────────────
-- STEP 2: dictionary_words (60 rows)
-- ────────────────────────────────────────────────────────────
INSERT INTO dictionary_words
  (id, word, normalized_word, phonetic_ipa, part_of_speech, cefr_level, level,
   difficulty, is_core_word, is_exam_word, source_type, source_note, created_at, updated_at)
VALUES
  ('accept','accept','accept','/əkˈsɛpt/','verb','A2','elementary',1,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('achieve','achieve','achieve','/əˈtʃiːv/','verb','A2','elementary',1,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('active','active','active','/ˈæktɪv/','adjective','A2','elementary',1,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('communicate','communicate','communicate','/kəˈmjuːnɪkeɪt/','verb','A2','elementary',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('create','create','create','/kriˈeɪt/','verb','A2','elementary',1,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('decide','decide','decide','/dɪˈsaɪd/','verb','A2','elementary',1,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('describe','describe','describe','/dɪˈskraɪb/','verb','A2','elementary',1,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('discover','discover','discover','/dɪˈskʌvər/','verb','A2','elementary',1,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('accurate','accurate','accurate','/ˈækjərɪt/','adjective','B1','intermediate',2,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('adapt','adapt','adapt','/əˈdæpt/','verb','B1','intermediate',2,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('appreciate','appreciate','appreciate','/əˈpriːʃɪeɪt/','verb','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('approach','approach','approach','/əˈprəʊtʃ/','noun','B1','intermediate',2,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('aware','aware','aware','/əˈwɛər/','adjective','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('capable','capable','capable','/ˈkeɪpəbəl/','adjective','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('compare','compare','compare','/kəmˈpɛər/','verb','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('confident','confident','confident','/ˈkɒnfɪdənt/','adjective','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('consider','consider','consider','/kənˈsɪdər/','verb','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('contribute','contribute','contribute','/kənˈtrɪbjuːt/','verb','B1','intermediate',2,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('demonstrate','demonstrate','demonstrate','/ˈdɛmənstreɪt/','verb','B1','intermediate',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('effective','effective','effective','/ɪˈfɛktɪv/','adjective','B1','intermediate',2,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('explore','explore','explore','/ɪkˈsplɔːr/','verb','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('flexible','flexible','flexible','/ˈflɛksɪbəl/','adjective','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('improve','improve','improve','/ɪmˈpruːv/','verb','B1','intermediate',1,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('reduce','reduce','reduce','/rɪˈdjuːs/','verb','B1','intermediate',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('accomplish','accomplish','accomplish','/əˈkɒmplɪʃ/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('acknowledge','acknowledge','acknowledge','/əkˈnɒlɪdʒ/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('analyze','analyze','analyze','/ˈænəlaɪz/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('anticipate','anticipate','anticipate','/ænˈtɪsɪpeɪt/','verb','B2','advanced',3,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('assess','assess','assess','/əˈsɛs/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('clarify','clarify','clarify','/ˈklærɪfaɪ/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('collaborate','collaborate','collaborate','/kəˈlæbəreɪt/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('consistent','consistent','consistent','/kənˈsɪstənt/','adjective','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('construct','construct','construct','/kənˈstrʌkt/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('distinguish','distinguish','distinguish','/dɪˈstɪŋɡwɪʃ/','verb','B2','advanced',3,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('elaborate','elaborate','elaborate','/ɪˈlæbəreɪt/','verb','B2','advanced',3,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('emphasize','emphasize','emphasize','/ˈɛmfəsaɪz/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('enhance','enhance','enhance','/ɪnˈhɑːns/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('evolve','evolve','evolve','/ɪˈvɒlv/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('expand','expand','expand','/ɪkˈspænd/','verb','B2','advanced',2,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('identify','identify','identify','/aɪˈdɛntɪfaɪ/','verb','B2','advanced',2,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('influence','influence','influence','/ˈɪnfluəns/','noun','B2','advanced',2,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('justify','justify','justify','/ˈdʒʌstɪfaɪ/','verb','B2','advanced',3,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('maintain','maintain','maintain','/meɪnˈteɪn/','verb','B2','advanced',2,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('significant','significant','significant','/sɪɡˈnɪfɪkənt/','adjective','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('strengthen','strengthen','strengthen','/ˈstrɛŋθən/','verb','B2','advanced',3,true,false,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('transform','transform','transform','/trænsˈfɔːrm/','verb','B2','advanced',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('abstract','abstract','abstract','/ˈæbstrækt/','adjective','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('advocate','advocate','advocate','/ˈædvəkeɪt/','verb','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('coherent','coherent','coherent','/kəʊˈhɪərənt/','adjective','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('comprehensive','comprehensive','comprehensive','/ˌkɒmprɪˈhɛnsɪv/','adjective','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('constitute','constitute','constitute','/ˈkɒnstɪtjuːt/','verb','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('contradict','contradict','contradict','/ˌkɒntrəˈdɪkt/','verb','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('conventional','conventional','conventional','/kənˈvɛnʃənəl/','adjective','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('fundamental','fundamental','fundamental','/ˌfʌndəˈmɛntəl/','adjective','C1','exam-prep',4,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('illuminate','illuminate','illuminate','/ɪˈluːmɪneɪt/','verb','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('implement','implement','implement','/ˈɪmplɪmɛnt/','verb','C1','exam-prep',4,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('perceive','perceive','perceive','/pəˈsiːv/','verb','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('phenomenon','phenomenon','phenomenon','/fɪˈnɒmɪnɒn/','noun','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('relevant','relevant','relevant','/ˈrɛlɪvənt/','adjective','C1','exam-prep',3,true,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW()),
  ('subtle','subtle','subtle','/ˈsʌtəl/','adjective','C1','exam-prep',4,false,true,'original','Original educational seed content created for LexiOcean Phase 6B.',NOW(),NOW());

-- ────────────────────────────────────────────────────────────
-- STEP 3: dictionary_definitions
-- ────────────────────────────────────────────────────────────
INSERT INTO dictionary_definitions (word_id, part_of_speech, definition_en, definition_zh, order_index, source_type) VALUES
  ('accept','verb','to willingly take or receive something that is offered or given','接受；接纳',0,'original'),
  ('achieve','verb','to successfully reach a goal through hard work and effort','实现；取得（成就）',0,'original'),
  ('active','adjective','always doing things; full of energy and movement','活跃的；积极的',0,'original'),
  ('communicate','verb','to share information, ideas, or feelings with others through speaking, writing, or other means','交流；沟通；传达',0,'original'),
  ('create','verb','to make or produce something new that did not exist before','创造；创建',0,'original'),
  ('decide','verb','to choose a course of action after thinking about different possibilities','决定；下决心',0,'original'),
  ('describe','verb','to say or write what someone or something is like in detail','描述；描写',0,'original'),
  ('discover','verb','to find or learn about something for the first time','发现；找到',0,'original'),
  ('accurate','adjective','completely correct and without any mistakes','准确的；精确的',0,'original'),
  ('adapt','verb','to change your behavior or methods to fit a new situation','适应；改编',0,'original'),
  ('appreciate','verb','to understand the value or importance of something and feel grateful for it','欣赏；感激；理解（价值）',0,'original'),
  ('approach','noun','a way of dealing with a problem or situation','方法；途径',0,'original'),
  ('approach','verb','to come near to someone or something','接近；靠近',1,'original'),
  ('aware','adjective','knowing that something exists or is happening; having knowledge or understanding of a situation','意识到的；知道的',0,'original'),
  ('capable','adjective','having the skill or ability to do something well','有能力的；能干的',0,'original'),
  ('compare','verb','to look at two or more things together to see how they are similar or different','比较；比拟',0,'original'),
  ('confident','adjective','feeling sure of yourself and your abilities; not shy or nervous','自信的；有把握的',0,'original'),
  ('consider','verb','to think carefully about something before making a decision','考虑；认为',0,'original'),
  ('contribute','verb','to give something such as money, time, or effort to help achieve a common goal','贡献；提供；撰写',0,'original'),
  ('demonstrate','verb','to show clearly how something works or how to do something','展示；证明；示范',0,'original'),
  ('effective','adjective','producing the result that you wanted; working well','有效的；有效率的',0,'original'),
  ('explore','verb','to travel through or examine something carefully to learn about it','探索；探险；探究',0,'original'),
  ('flexible','adjective','able to change or adapt easily to new situations','灵活的；可变通的；柔韧的',0,'original'),
  ('improve','verb','to become better or to make something better','改善；提高；进步',0,'original'),
  ('reduce','verb','to make something smaller in size, amount, or degree','减少；降低；缩小',0,'original'),
  ('accomplish','verb','to successfully complete a task or goal that required skill or effort','完成；实现（目标）',0,'original'),
  ('acknowledge','verb','to accept or admit that something is true or that someone has done something','承认；认可；感谢',0,'original'),
  ('analyze','verb','to study or examine something carefully in order to understand it better','分析；解析',0,'original'),
  ('anticipate','verb','to expect that something will happen and prepare for it in advance','预期；预料；提前准备',0,'original'),
  ('assess','verb','to judge or evaluate the quality, importance, or value of something','评估；评价',0,'original'),
  ('clarify','verb','to make something clearer and easier to understand by explaining it further','澄清；阐明',0,'original'),
  ('collaborate','verb','to work together with other people to achieve a shared goal','合作；协作',0,'original'),
  ('consistent','adjective','always doing things in the same way and to the same standard over time','始终如一的；一贯的',0,'original'),
  ('construct','verb','to build or create something by putting parts together in an organized way','建造；构建；构成',0,'original'),
  ('distinguish','verb','to recognize the difference between two or more similar things','区分；辨别',0,'original'),
  ('elaborate','verb','to add more details or information to make something clearer or more complete','详细说明；阐述',0,'original'),
  ('emphasize','verb','to give special importance or attention to something','强调；着重指出',0,'original'),
  ('enhance','verb','to increase or improve the quality, value, or ability of something','增强；提高（质量或能力）',0,'original'),
  ('evolve','verb','to change or develop gradually over a period of time','演变；逐渐发展',0,'original'),
  ('expand','verb','to become larger or wider, or to make something larger or wider','扩大；扩展；膨胀',0,'original'),
  ('identify','verb','to recognize and name who or what someone or something is','识别；鉴别；确认',0,'original'),
  ('influence','noun','the power to affect how someone thinks or acts, or how something develops','影响（力）；作用',0,'original'),
  ('influence','verb','to have an effect on the way someone thinks, behaves, or develops','影响；作用于',1,'original'),
  ('justify','verb','to give a good enough reason for doing or believing something','证明...有理；为...辩护',0,'original'),
  ('maintain','verb','to keep something in good condition or to continue at the same level','保持；维持；维护',0,'original'),
  ('significant','adjective','important enough to be noticed or to have an effect','重要的；显著的',0,'original'),
  ('strengthen','verb','to make something more powerful, effective, or secure','加强；巩固',0,'original'),
  ('transform','verb','to change something completely into something very different','转变；彻底改变',0,'original'),
  ('abstract','adjective','existing as an idea rather than as a physical thing; difficult to understand or describe','抽象的；难以理解的',0,'original'),
  ('advocate','verb','to strongly support or argue in favor of a cause, idea, or policy','提倡；主张；为...辩护',0,'original'),
  ('advocate','noun','a person who strongly supports a cause or speaks on behalf of someone','倡导者；辩护人',1,'original'),
  ('coherent','adjective','logically connected and easy to understand; making sense as a whole','连贯的；逻辑一致的',0,'original'),
  ('comprehensive','adjective','including all or almost all aspects of something; very thorough and complete','全面的；综合的；包罗万象的',0,'original'),
  ('constitute','verb','to be a part that makes up a whole; to represent or formally form something','构成；组成；相当于',0,'original'),
  ('contradict','verb','to say or do something that is the opposite of what someone else has said; to conflict with','与...矛盾；反驳',0,'original'),
  ('conventional','adjective','following the traditional and accepted way of doing things; ordinary and expected','传统的；惯例的；普通的',0,'original'),
  ('fundamental','adjective','forming the most basic and essential part of something; necessary and important above everything else','基本的；根本的；至关重要的',0,'original'),
  ('illuminate','verb','to make something clear and easier to understand; to light up a dark area','阐明；照亮；启迪',0,'original'),
  ('implement','verb','to put a plan, decision, or system into action; to start using a new approach','实施；执行；落实',0,'original'),
  ('perceive','verb','to notice, understand, or interpret something in a particular way through your senses or mind','感知；认为；察觉',0,'original'),
  ('phenomenon','noun','a fact or event that exists or happens, especially one that is interesting or unusual','现象；非凡的人或事',0,'original'),
  ('relevant','adjective','closely connected to and important for the subject or situation being considered','相关的；有关的；切题的',0,'original'),
  ('subtle','adjective','small and difficult to notice; not obvious; requiring careful attention to be understood','细微的；隐约的；微妙的',0,'original');

-- ────────────────────────────────────────────────────────────
-- STEP 4: dictionary_examples
-- ────────────────────────────────────────────────────────────
INSERT INTO dictionary_examples (word_id, sentence_en, sentence_zh, order_index, source_type) VALUES
  ('accept','She decided to accept the invitation to join the team.','她决定接受加入团队的邀请。',0,'original'),
  ('accept','He accepted the job offer without hesitation.','他毫不犹豫地接受了工作邀请。',1,'original'),
  ('achieve','With daily practice, you can achieve your language goals.','通过每日练习，你可以实现你的语言目标。',0,'original'),
  ('active','Staying active helps improve both your physical and mental health.','保持活跃有助于改善身心健康。',0,'original'),
  ('communicate','Learning English helps you communicate with people from around the world.','学习英语帮助你与世界各地的人交流。',0,'original'),
  ('create','Children love to create colorful paintings in art class.','孩子们喜欢在美术课上创作色彩丰富的画作。',0,'original'),
  ('decide','He spent an hour trying to decide which book to read first.','他花了一个小时试图决定先读哪本书。',0,'original'),
  ('describe','Please describe your ideal study environment in a few sentences.','请用几句话描述你理想的学习环境。',0,'original'),
  ('discover','She was excited to discover a new word she had never seen before.','她很兴奋地发现了一个她以前从未见过的新单词。',0,'original'),
  ('accurate','Always check that your pronunciation is accurate before teaching others.','在教别人之前，一定要检查你的发音是否准确。',0,'original'),
  ('adapt','Good learners adapt their study strategies when their current approach is not working.','优秀的学习者在当前方法无效时会调整学习策略。',0,'original'),
  ('appreciate','After studying abroad, she really began to appreciate her native language.','留学后，她真正开始欣赏她的母语。',0,'original'),
  ('approach','Her approach to learning vocabulary is to use words in real sentences every day.','她学习词汇的方法是每天在真实句子中使用单词。',0,'original'),
  ('aware','Being aware of your own mistakes is the first step to improving.','意识到自己的错误是进步的第一步。',0,'original'),
  ('capable','With practice, anyone is capable of learning a new language.','通过练习，任何人都有能力学习一门新语言。',0,'original'),
  ('compare','Comparing similar words helps you understand their differences.','比较相似的单词有助于理解它们之间的差异。',0,'original'),
  ('confident','Practice speaking every day until you feel confident using English in public.','每天练习口语，直到你对在公开场合使用英语感到自信。',0,'original'),
  ('consider','Before answering, take a moment to consider all the possibilities.','回答之前，花点时间考虑所有可能性。',0,'original'),
  ('contribute','Every student was asked to contribute one new word to the class vocabulary wall.','每位学生被要求向班级词汇墙贡献一个新单词。',0,'original'),
  ('demonstrate','The teacher will demonstrate the correct way to pronounce the sounds.','老师将示范正确的发音方法。',0,'original'),
  ('effective','Spaced repetition is one of the most effective methods for remembering new vocabulary.','间隔重复是记忆新词汇最有效的方法之一。',0,'original'),
  ('explore','Take time to explore different study methods and find what works best for you.','花时间探索不同的学习方法，找出最适合你的方式。',0,'original'),
  ('flexible','A flexible study schedule allows you to learn at your best times.','灵活的学习计划让你在最佳状态时学习。',0,'original'),
  ('improve','You will improve your listening skills by watching English films daily.','每天看英语电影你会提高你的听力技能。',0,'original'),
  ('reduce','Using flashcards can help reduce the time you spend reviewing vocabulary.','使用单词卡可以帮助减少复习词汇的时间。',0,'original'),
  ('accomplish','She accomplished her goal of reading one English book per month.','她实现了每月阅读一本英文书的目标。',0,'original'),
  ('acknowledge','It is important to acknowledge your mistakes in order to learn from them.','承认自己的错误很重要，这样才能从中吸取教训。',0,'original'),
  ('analyze','After each quiz, analyze which types of questions you got wrong.','每次测验后，分析你答错了哪类问题。',0,'original'),
  ('anticipate','Experienced learners anticipate which grammar points will appear in the test.','经验丰富的学习者能预料到考试中会出现哪些语法点。',0,'original'),
  ('assess','Use a self-quiz to assess how well you know this week''s vocabulary.','用自我测验来评估你对本周词汇的掌握程度。',0,'original'),
  ('clarify','If you do not understand a word, ask your teacher to clarify its meaning.','如果你不理解一个词，请老师阐明其含义。',0,'original'),
  ('collaborate','Students in the study group collaborate to review difficult vocabulary together.','学习小组的学生合作复习难度较高的词汇。',0,'original'),
  ('consistent','Being consistent with your daily study habits is more effective than studying for hours once a week.','坚持每日学习习惯比每周一次性学习几小时更有效。',0,'original'),
  ('construct','Learning grammar means understanding how to construct sentences correctly.','学习语法意味着理解如何正确构建句子。',0,'original'),
  ('distinguish','Advanced speakers can distinguish subtle differences in word meaning.','高级口语者能区分词义上的细微差别。',0,'original'),
  ('elaborate','When writing an essay, always elaborate on your main points with examples.','写文章时，始终用例子详细说明你的要点。',0,'original'),
  ('emphasize','Teachers often emphasize the importance of daily reading practice.','老师们常常强调每日阅读练习的重要性。',0,'original'),
  ('enhance','Using vocabulary in real conversations helps enhance your retention.','在真实对话中使用词汇有助于增强你的记忆保留。',0,'original'),
  ('evolve','Your English ability will naturally evolve if you practice consistently.','如果你坚持练习，你的英语能力会自然地逐渐提高。',0,'original'),
  ('expand','Reading widely is one of the best ways to expand your vocabulary.','广泛阅读是扩大词汇量的最佳方法之一。',0,'original'),
  ('identify','Can you identify any words in this passage that you do not know?','你能识别出这篇文章中你不认识的单词吗？',0,'original'),
  ('influence','Your reading habits can have a major influence on your vocabulary growth.','你的阅读习惯对词汇增长有重大影响。',0,'original'),
  ('justify','In your essay, make sure you justify each argument with clear evidence.','在你的文章中，确保用明确的证据为每个论点提供理由。',0,'original'),
  ('maintain','Keep a study journal to maintain a record of new words you learn.','保持学习日记来记录你学到的新单词。',0,'original'),
  ('significant','There was a significant improvement in her writing skills after three months.','三个月后，她的写作技能有了显著提高。',0,'original'),
  ('strengthen','Review sessions help strengthen your memory of new vocabulary.','复习环节有助于巩固你对新词汇的记忆。',0,'original'),
  ('transform','Learning a new language can transform the way you understand other cultures.','学习一门新语言可以彻底改变你理解其他文化的方式。',0,'original'),
  ('abstract','Concepts like justice and freedom are abstract but deeply important.','"正义"和"自由"等概念是抽象的，但极其重要。',0,'original'),
  ('advocate','She advocates learning vocabulary in context rather than from a list.','她提倡在语境中学习词汇，而不是从单词表中学习。',0,'original'),
  ('coherent','A well-written paragraph is coherent, with each sentence building on the last.','写得好的段落是连贯的，每个句子都在前一句的基础上展开。',0,'original'),
  ('comprehensive','This course provides a comprehensive review of English grammar rules.','这门课提供了对英语语法规则的全面复习。',0,'original'),
  ('constitute','Regular practice and review constitute the foundation of language learning.','定期练习和复习构成语言学习的基础。',0,'original'),
  ('contradict','If your example sentence contradicts the definition, students will be confused.','如果你的例句与定义矛盾，学生们会感到困惑。',0,'original'),
  ('conventional','Conventional textbooks may not always be the most engaging way to learn a language.','传统教科书不一定总是最吸引人的语言学习方式。',0,'original'),
  ('fundamental','A strong vocabulary is fundamental to success in any language exam.','丰富的词汇量是任何语言考试取得成功的根本。',0,'original'),
  ('illuminate','Good examples can illuminate even the most complex grammatical rules.','好的例子能阐明即使是最复杂的语法规则。',0,'original'),
  ('implement','After learning about spaced repetition, she immediately implemented it in her study routine.','了解间隔重复后，她立即将其应用到学习日程中。',0,'original'),
  ('perceive','Students often perceive difficult words as obstacles, but they are really opportunities.','学生通常将难词视为障碍，但它们实际上是机会。',0,'original'),
  ('phenomenon','Language acquisition in young children is a fascinating phenomenon.','幼儿语言习得是一种令人着迷的现象。',0,'original'),
  ('relevant','Choose vocabulary that is relevant to your professional or academic goals.','选择与你的职业或学业目标相关的词汇。',0,'original'),
  ('subtle','The subtle difference between "imply" and "infer" confuses many learners.','"imply"和"infer"之间的细微差别让许多学习者感到困惑。',0,'original');

-- ────────────────────────────────────────────────────────────
-- STEP 5: word_pronunciations (US + UK for each word, browser-tts, no audio_url)
-- ────────────────────────────────────────────────────────────
INSERT INTO word_pronunciations (word_id, accent, phonetic_ipa, provider, is_default, source_type)
SELECT id, 'us', phonetic_ipa, 'browser-tts', true, 'original'
FROM dictionary_words
WHERE id IN (
  'accept','achieve','active','communicate','create','decide','describe','discover',
  'accurate','adapt','appreciate','approach','aware','capable','compare','confident',
  'consider','contribute','demonstrate','effective','explore','flexible','improve','reduce',
  'accomplish','acknowledge','analyze','anticipate','assess','clarify','collaborate',
  'consistent','construct','distinguish','elaborate','emphasize','enhance','evolve','expand',
  'identify','influence','justify','maintain','significant','strengthen','transform',
  'abstract','advocate','coherent','comprehensive','constitute','contradict','conventional',
  'fundamental','illuminate','implement','perceive','phenomenon','relevant','subtle'
);

INSERT INTO word_pronunciations (word_id, accent, phonetic_ipa, provider, is_default, source_type)
SELECT id, 'uk', phonetic_ipa, 'browser-tts', false, 'original'
FROM dictionary_words
WHERE id IN (
  'accept','achieve','active','communicate','create','decide','describe','discover',
  'accurate','adapt','appreciate','approach','aware','capable','compare','confident',
  'consider','contribute','demonstrate','effective','explore','flexible','improve','reduce',
  'accomplish','acknowledge','analyze','anticipate','assess','clarify','collaborate',
  'consistent','construct','distinguish','elaborate','emphasize','enhance','evolve','expand',
  'identify','influence','justify','maintain','significant','strengthen','transform',
  'abstract','advocate','coherent','comprehensive','constitute','contradict','conventional',
  'fundamental','illuminate','implement','perceive','phenomenon','relevant','subtle'
);

-- ────────────────────────────────────────────────────────────
-- STEP 6: word_mnemonics (selected words only)
-- ────────────────────────────────────────────────────────────
INSERT INTO word_mnemonics (word_id, mnemonic_en, mnemonic_zh, mnemonic_style, is_ai_generated, is_reviewed, order_index, source_type) VALUES
  ('achieve','A CHIEF always achieves — the chief works hard and gets results.','首领（chief）总是能实现（achieve）目标。','standard',false,true,0,'original'),
  ('communicate','COMMUN-ICATE: "commune" means to share — communicate brings people into a common space.','commun- 是 community（社区）的词根，communicate 就是让人们连接在一起。','standard',false,true,0,'original'),
  ('accurate','An accurate cure works EXACTLY — no mistakes allowed.','accurate 好比一个"准确的药方"，有效果，不会出错。','standard',false,true,0,'original'),
  ('appreciate','PRECIOUS — appreciate contains "preci" related to price; you appreciate things that are precious.','appreciate 和 price（价值）有联系——你重视有价值的东西。','standard',false,true,0,'original'),
  ('accomplish','Once you accomplish something, your to-do list looks "complete-ish" — ACCOMPL-ISHED!','accomplish 含有 complete 的感觉——完成了！打勾！','standard',false,true,0,'original'),
  ('anticipate','Think of ants (ANT-icipate) that ALWAYS prepare food for winter — they anticipate the cold!','蚂蚁总是提前备粮过冬，就像 anticipate（预先做准备）。','standard',false,true,0,'original'),
  ('clarify','CLARI-FY: make it CLEAR so people can understand.','clarify = clear（清晰）+ fy（使...）= 使...变清晰。','standard',false,true,0,'original'),
  ('distinguish','DIS-STING-UISH: a bee''s STING is distinctive — you can always distinguish a bee from a fly!','蜜蜂的刺（sting）是它区别于苍蝇的特征，distinguish 就是找出这样的区别。','standard',false,true,0,'original'),
  ('justify','JUST-IFY: just like a judge says "justified!" — you give a JUST reason.','justify = just（公正）+ ify（使...）= 使某件事显得公正合理。','standard',false,true,0,'original'),
  ('transform','A TRANS-FORMER changes its FORM completely — just like transform!','变形金刚 Transformer 就是 transform（彻底改变形态）的活例子。','standard',false,true,0,'original'),
  ('abstract','AB-STRACT: things ABSTRACT from the world are TAKEN AWAY (ab = away, tract = draw); they can''t be touched.','abstract = ab（离开）+ tract（拉）= 被从现实中"拉离"，因此是抽象的。','standard',false,true,0,'original'),
  ('coherent','CO-HERE-NT: ideas that COHERE stick HERE together — they make sense as a whole.','cohere = co（一起）+ here（这里），连贯就是把想法聚合在一起。','standard',false,true,0,'original'),
  ('contradict','CONTRA-DICT: going AGAINST (contra) what was SAID (dict).','contra（对立）+ dict（说）= 说对立的话，即矛盾。','standard',false,true,0,'original'),
  ('illuminate','ILLUMI-NATE: illuminate your mind like a lamp — it removes the darkness of confusion.','illuminate = 照明，好比给黑暗中的知识"点亮一盏灯"。','standard',false,true,0,'original'),
  ('phenomenon','A PHENOM-ENON is a PHENOMENAL event — something that turns everyone''s head.','现象是大家都关注的"大事"，就像一个"现象级"（phenomenal）事件。','standard',false,true,0,'original'),
  ('subtle','SUB-TLE: SUBway goes underground — subtle things hide below the surface.','subtle 就像潜入地下的地铁——细微的东西藏在表面之下。','standard',false,true,0,'original');

-- ────────────────────────────────────────────────────────────
-- STEP 7: dictionary_etymology (selected words)
-- ────────────────────────────────────────────────────────────
INSERT INTO dictionary_etymology (word_id, roots, explanation_en, explanation_zh, source_type) VALUES
  ('active','Latin: actus','From Latin "actus" meaning a doing or action.','来自拉丁语 "actus"，意为行为或动作。','original'),
  ('communicate','Latin: communicare','From Latin "communicare" meaning to share or make common.','来自拉丁语 "communicare"，意为分享或使共同。','original'),
  ('create','Latin: creare','From Latin "creare" meaning to make or produce.','来自拉丁语 "creare"，意为制造或生产。','original'),
  ('decide','Latin: de + caedere','From Latin "de-" (away) + "caedere" (to cut); to cut away uncertainty.','来自拉丁语 "de-"（远离）+ "caedere"（切）；切断不确定性。','original'),
  ('describe','Latin: de + scribere','From Latin "de-" (down) + "scribere" (to write); to write down in detail.','来自拉丁语 "de-"（向下）+ "scribere"（写）；详细写下。','original'),
  ('discover','Latin: dis + cooperire','From Latin "dis-" (away) + "cooperire" (to cover); literally to uncover.','来自拉丁语 "dis-"（离开）+ "cooperire"（覆盖）；字面意为揭开。','original'),
  ('adapt','Latin: adaptare','From Latin "adaptare" meaning to fit or adjust.','来自拉丁语 "adaptare"，意为适应或调整。','original'),
  ('appreciate','Latin: appretiare','From Latin "appretiare" meaning to set a price on or value.','来自拉丁语 "appretiare"，意为给...定价或重视。','original'),
  ('approach','Latin: ad + propiare','From Latin "ad-" (to) + "propiare" (to come near).','来自拉丁语 "ad-"（向）+ "propiare"（靠近）。','original'),
  ('capable','Latin: capere','From Latin "capere" meaning to take or hold; capable = able to hold or handle.','来自拉丁语 "capere"，意为取或持有；有能力=能够持有/处理。','original'),
  ('contribute','Latin: con + tribuere','From Latin "con-" (together) + "tribuere" (to give).','来自拉丁语 "con-"（共同）+ "tribuere"（给予）。','original'),
  ('collaborate','Latin: co + laborare','From Latin "co-" (together) + "laborare" (to work).','来自拉丁语 "co-"（共同）+ "laborare"（工作）。','original'),
  ('construct','Latin: con + struere','From Latin "con-" (together) + "struere" (to pile up or build).','来自拉丁语 "con-"（共同）+ "struere"（堆叠或建造）。','original'),
  ('distinguish','Latin: distinguere','From Latin "distinguere" meaning to mark off or separate.','来自拉丁语 "distinguere"，意为标记分离。','original'),
  ('evolve','Latin: e + volvere','From Latin "e-" (out) + "volvere" (to roll); to unroll or develop.','来自拉丁语 "e-"（出）+ "volvere"（卷）；展开或发展。','original'),
  ('expand','Latin: expandere','From Latin "expandere" meaning to spread out.','来自拉丁语 "expandere"，意为展开。','original'),
  ('influence','Latin: influere','From Latin "influere" meaning to flow into; once meant the flowing of celestial power.','来自拉丁语 "influere"，意为流入；曾指天体能量的"流动"。','original'),
  ('transform','Latin: trans + formare','From Latin "trans-" (across) + "formare" (to form).','来自拉丁语 "trans-"（跨越）+ "formare"（形成）。','original'),
  ('abstract','Latin: abstractus','From Latin "abstractus" meaning drawn away or separated.','来自拉丁语 "abstractus"，意为被拉离或分离。','original'),
  ('advocate','Latin: ad + vocare','From Latin "ad-" (to) + "vocare" (to call); to call someone to your side.','来自拉丁语 "ad-"（向）+ "vocare"（呼叫）；呼唤某人站在你这边。','original'),
  ('coherent','Latin: cohaerere','From Latin "cohaerere" meaning to stick together.','来自拉丁语 "cohaerere"，意为粘在一起。','original'),
  ('constitute','Latin: con + statuere','From Latin "con-" (together) + "statuere" (to set up).','来自拉丁语 "con-"（共同）+ "statuere"（建立）。','original'),
  ('fundamental','Latin: fundamentum','From Latin "fundamentum" meaning foundation or base.','来自拉丁语 "fundamentum"，意为基础或底部。','original'),
  ('illuminate','Latin: illuminare','From Latin "illuminare" meaning to light up.','来自拉丁语 "illuminare"，意为照亮。','original'),
  ('perceive','Latin: per + capere','From Latin "per-" (thoroughly) + "capere" (to take or grasp).','来自拉丁语 "per-"（完全地）+ "capere"（取或抓握）。','original'),
  ('phenomenon','Greek: phainomenon','From Greek "phainomenon" meaning something that appears or shows itself.','来自希腊语 "phainomenon"，意为出现或显示自身的事物。','original'),
  ('subtle','Latin: subtilis','From Latin "subtilis" meaning fine, exact, or delicate.','来自拉丁语 "subtilis"，意为精细、精确或微妙。','original');

-- ────────────────────────────────────────────────────────────
-- STEP 8: exam_word_tags
-- ────────────────────────────────────────────────────────────
INSERT INTO exam_word_tags (word_id, exam_type) VALUES
  ('accurate','IELTS'),('accurate','TOEFL'),
  ('adapt','IELTS'),('adapt','TOEFL'),
  ('approach','IELTS'),('approach','TOEFL'),
  ('contribute','IELTS'),
  ('demonstrate','IELTS'),('demonstrate','TOEFL'),
  ('effective','IELTS'),('effective','TOEFL'),
  ('accomplish','TOEFL'),
  ('acknowledge','IELTS'),('acknowledge','TOEFL'),
  ('analyze','IELTS'),('analyze','TOEFL'),('analyze','GRE'),
  ('anticipate','IELTS'),('anticipate','TOEFL'),('anticipate','GRE'),
  ('assess','IELTS'),('assess','TOEFL'),
  ('clarify','IELTS'),
  ('collaborate','IELTS'),('collaborate','TOEFL'),
  ('consistent','IELTS'),('consistent','TOEFL'),
  ('construct','IELTS'),('construct','TOEFL'),
  ('distinguish','IELTS'),('distinguish','TOEFL'),('distinguish','GRE'),
  ('elaborate','IELTS'),('elaborate','TOEFL'),
  ('emphasize','IELTS'),('emphasize','TOEFL'),
  ('enhance','IELTS'),('enhance','TOEFL'),
  ('evolve','IELTS'),('evolve','TOEFL'),
  ('identify','IELTS'),('identify','TOEFL'),
  ('influence','IELTS'),('influence','TOEFL'),
  ('justify','IELTS'),('justify','TOEFL'),('justify','GRE'),
  ('maintain','IELTS'),('maintain','TOEFL'),
  ('significant','IELTS'),('significant','TOEFL'),
  ('transform','IELTS'),('transform','TOEFL'),
  ('abstract','GRE'),('abstract','SAT'),
  ('advocate','IELTS'),('advocate','TOEFL'),('advocate','GRE'),
  ('coherent','IELTS'),('coherent','TOEFL'),('coherent','GRE'),
  ('comprehensive','IELTS'),('comprehensive','TOEFL'),
  ('constitute','GRE'),('constitute','TOEFL'),
  ('contradict','GRE'),('contradict','IELTS'),
  ('conventional','GRE'),('conventional','IELTS'),
  ('fundamental','IELTS'),('fundamental','TOEFL'),('fundamental','GRE'),
  ('illuminate','GRE'),('illuminate','SAT'),
  ('implement','IELTS'),('implement','TOEFL'),
  ('perceive','GRE'),('perceive','TOEFL'),
  ('phenomenon','GRE'),('phenomenon','TOEFL'),('phenomenon','IELTS'),
  ('relevant','IELTS'),('relevant','TOEFL'),
  ('subtle','GRE'),('subtle','SAT');

-- ────────────────────────────────────────────────────────────
-- END OF PHASE 6B SEED
-- ────────────────────────────────────────────────────────────
-- VERIFICATION QUERY:
--   SELECT COUNT(*) FROM dictionary_words;            -- should be 60
--   SELECT COUNT(*) FROM dictionary_definitions;      -- should be ~62
--   SELECT COUNT(*) FROM dictionary_examples;         -- should be ~61
--   SELECT COUNT(*) FROM word_mnemonics;              -- should be 16
--   SELECT COUNT(*) FROM dictionary_etymology;        -- should be 27
--   SELECT COUNT(*) FROM word_pronunciations;         -- should be 120
--   SELECT COUNT(*) FROM exam_word_tags;              -- should be ~90
-- ────────────────────────────────────────────────────────────
