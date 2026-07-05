import type {
  DictionaryImportCollocation,
  DictionaryImportMnemonic,
} from '@/lib/dictionary/dictionary-import-types'

export interface DictionaryGraphEnrichment {
  normalizedWord: string
  synonyms?: string[]
  antonyms?: string[]
  collocations?: DictionaryImportCollocation[]
  relatedWords?: string[]
  themeTags?: string[]
  domainTags?: string[]
  examTags?: string[]
  wordFamily?: string[]
  sceneUsage?: string[]
  mnemonics?: DictionaryImportMnemonic[]
}

type Row = [
  word: string,
  theme: string,
  domain: string,
  synonyms: string[],
  antonyms: string[],
  collocations: string[],
  relatedWords: string[],
  wordFamily?: string[],
]

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function makeCollocation(word: string, phrase: string): DictionaryImportCollocation {
  return {
    phrase,
    exampleEn: `Learners can notice "${phrase}" when they use ${word} in context.`,
    exampleZh: `\u5b66\u4e60\u8005\u53ef\u4ee5\u5728\u8bed\u5883\u4e2d\u8bc6\u522b ${phrase}\u3002`,
  }
}

function makeEntry([word, theme, domain, synonyms, antonyms, collocations, relatedWords, wordFamily]: Row): DictionaryGraphEnrichment {
  return {
    normalizedWord: normalize(word),
    synonyms,
    antonyms,
    collocations: collocations.map((phrase) => makeCollocation(word, phrase)),
    relatedWords,
    themeTags: [theme],
    domainTags: [domain],
    examTags: theme === 'exam' || domain === 'exam-prep' ? ['CET-4', 'CET-6'] : [],
    wordFamily: wordFamily ?? [normalize(word)],
    sceneUsage: [`${theme} discussion`, `${domain} practice`, `${word} in context`],
    mnemonics: [
      {
        mnemonic: `Link "${word}" with ${theme}; the relation helps the graph stay memorable.`,
        mnemonicZh: `\u628a ${word} \u548c ${theme} \u8054\u7cfb\u8d77\u6765\uff0c\u5e2e\u52a9\u8bb0\u5fc6\u5173\u7cfb\u3002`,
        type: 'standard',
      },
    ],
  }
}

const ROWS: Row[] = [
  ['algorithm', 'technology', 'ai-tech', ['procedure', 'method', 'formula'], ['randomness'], ['algorithm design', 'learning algorithm', 'efficient algorithm'], ['data', 'model', 'automation'], ['algorithm', 'algorithmic']],
  ['database', 'technology', 'ai-tech', ['data store', 'repository', 'archive'], ['paper record'], ['database table', 'search a database', 'database query'], ['record', 'system', 'storage'], ['database']],
  ['interface', 'technology', 'ai-tech', ['screen', 'gateway', 'control panel'], ['barrier'], ['user interface', 'interface design', 'clear interface'], ['dashboard', 'system', 'interaction'], ['interface']],
  ['network', 'technology', 'ai-tech', ['web', 'system', 'connection'], ['isolation'], ['network signal', 'social network', 'network connection'], ['device', 'node', 'communication'], ['network', 'networked']],
  ['signal', 'technology', 'ai-tech', ['sign', 'message', 'indicator'], ['noise'], ['clear signal', 'weak signal', 'signal pattern'], ['data', 'communication', 'sensor'], ['signal']],
  ['dashboard', 'technology', 'ai-tech', ['panel', 'display', 'summary screen'], ['hidden log'], ['dashboard view', 'project dashboard', 'learning dashboard'], ['status', 'metric', 'overview'], ['dashboard']],
  ['automation', 'technology', 'ai-tech', ['workflow', 'mechanization', 'automatic process'], ['manual work'], ['automation tool', 'workflow automation', 'automation system'], ['algorithm', 'process', 'efficiency'], ['automation', 'automate', 'automatic']],
  ['deployment', 'technology', 'ai-tech', ['release', 'rollout', 'launch'], ['withdrawal'], ['model deployment', 'deployment plan', 'safe deployment'], ['version', 'system', 'testing'], ['deployment', 'deploy']],
  ['iteration', 'technology', 'ai-tech', ['cycle', 'revision', 'repeat step'], ['finality'], ['design iteration', 'quick iteration', 'iteration cycle'], ['feedback', 'prototype', 'improvement'], ['iteration', 'iterate', 'iterative']],
  ['optimization', 'technology', 'ai-tech', ['improvement', 'refinement', 'tuning'], ['waste'], ['performance optimization', 'search optimization', 'optimization process'], ['efficiency', 'system', 'parameter'], ['optimization', 'optimize', 'optimal']],
  ['parameter', 'technology', 'ai-tech', ['setting', 'variable', 'limit'], ['constant'], ['model parameter', 'parameter value', 'adjust a parameter'], ['model', 'algorithm', 'configuration'], ['parameter']],
  ['protocol', 'technology', 'ai-tech', ['rule system', 'standard', 'procedure'], ['improvisation'], ['network protocol', 'safety protocol', 'protocol rule'], ['communication', 'system', 'standard'], ['protocol']],
  ['scalable', 'technology', 'ai-tech', ['expandable', 'flexible', 'growth-ready'], ['limited'], ['scalable system', 'scalable design', 'scalable workflow'], ['capacity', 'growth', 'architecture'], ['scalable', 'scale', 'scalability']],
  ['architecture', 'technology', 'ai-tech', ['structure', 'design', 'framework'], ['disorder'], ['system architecture', 'software architecture', 'clear architecture'], ['layer', 'component', 'interface'], ['architecture', 'architectural']],
  ['workflow', 'project-management', 'project', ['process', 'pipeline', 'work sequence'], ['disorder'], ['workflow step', 'team workflow', 'workflow automation'], ['task', 'process', 'handoff'], ['workflow']],
  ['contract', 'business', 'business', ['agreement', 'deal', 'arrangement'], ['dispute'], ['sign a contract', 'contract terms', 'contract review'], ['invoice', 'supplier', 'approval'], ['contract', 'contractual']],
  ['invoice', 'business', 'business', ['bill', 'statement', 'payment request'], ['receipt'], ['send an invoice', 'invoice number', 'invoice approval'], ['contract', 'payment', 'budget'], ['invoice']],
  ['supplier', 'business', 'business', ['provider', 'vendor', 'source'], ['customer'], ['supplier contract', 'reliable supplier', 'supplier list'], ['material', 'invoice', 'delivery'], ['supplier', 'supply']],
  ['budget', 'business', 'business', ['financial plan', 'allowance', 'spending plan'], ['overspend'], ['project budget', 'budget limit', 'monthly budget'], ['cost', 'estimate', 'invoice'], ['budget']],
  ['inspection', 'engineering', 'engineering', ['check', 'review', 'examination'], ['neglect'], ['quality inspection', 'site inspection', 'inspection report'], ['approval', 'standard', 'material'], ['inspection', 'inspect']],
  ['approval', 'business', 'business', ['permission', 'acceptance', 'authorization'], ['rejection'], ['final approval', 'approval process', 'request approval'], ['contract', 'review', 'decision'], ['approval', 'approve']],
  ['campaign', 'business', 'business', ['initiative', 'drive', 'organized effort'], ['inaction'], ['marketing campaign', 'campaign goal', 'campaign strategy'], ['audience', 'message', 'progress'], ['campaign']],
  ['agenda', 'project-management', 'business', ['plan', 'schedule', 'topic list'], ['improvisation'], ['meeting agenda', 'agenda item', 'set the agenda'], ['meeting', 'priority', 'discussion'], ['agenda']],
  ['deadline', 'project-management', 'project', ['due date', 'time limit', 'final date'], ['extension'], ['meet a deadline', 'project deadline', 'deadline pressure'], ['schedule', 'task', 'progress'], ['deadline']],
  ['progress', 'project-management', 'project', ['advance', 'improvement', 'movement'], ['setback'], ['project progress', 'track progress', 'steady progress'], ['status', 'goal', 'workflow'], ['progress', 'progressive']],
  ['status', 'project-management', 'project', ['condition', 'state', 'position'], ['unknown'], ['project status', 'status update', 'current status'], ['dashboard', 'progress', 'report'], ['status']],
  ['priority', 'project-management', 'project', ['importance', 'preference', 'main concern'], ['afterthought'], ['top priority', 'set priorities', 'priority task'], ['decision', 'goal', 'schedule'], ['priority', 'prioritize']],
  ['procedure', 'project-management', 'business', ['process', 'method', 'ordered steps'], ['disorder'], ['safety procedure', 'follow a procedure', 'procedure manual'], ['protocol', 'workflow', 'standard'], ['procedure', 'procedural']],
  ['quality', 'business', 'business', ['standard', 'value', 'condition'], ['defect'], ['quality control', 'high quality', 'quality check'], ['inspection', 'standard', 'performance'], ['quality']],
  ['reliable', 'business', 'business', ['dependable', 'trustworthy', 'stable'], ['unreliable'], ['reliable source', 'reliable supplier', 'reliable data'], ['trust', 'evidence', 'quality'], ['reliable', 'reliability']],
  ['forecast', 'academic', 'education', ['predict', 'project', 'estimate'], ['review'], ['forecast demand', 'forecast results', 'weather forecast'], ['trend', 'data', 'future'], ['forecast']],
  ['evidence', 'academic', 'education', ['proof', 'support', 'data'], ['claim without support'], ['strong evidence', 'provide evidence', 'evidence-based answer'], ['argument', 'research', 'reason'], ['evidence']],
  ['hypothesis', 'academic', 'education', ['assumption', 'proposal', 'testable idea'], ['confirmed fact'], ['test a hypothesis', 'research hypothesis', 'form a hypothesis'], ['evidence', 'variable', 'experiment'], ['hypothesis', 'hypothetical']],
  ['research', 'academic', 'education', ['study', 'investigation', 'inquiry'], ['guess'], ['conduct research', 'research question', 'research method'], ['evidence', 'theory', 'data'], ['research', 'researcher']],
  ['theory', 'academic', 'education', ['explanation', 'model', 'framework'], ['practice'], ['scientific theory', 'learning theory', 'theory of change'], ['hypothesis', 'evidence', 'principle'], ['theory', 'theoretical']],
  ['variable', 'academic', 'education', ['factor', 'element', 'changeable value'], ['constant'], ['control a variable', 'research variable', 'variable value'], ['hypothesis', 'data', 'experiment'], ['variable']],
  ['assumption', 'academic', 'education', ['belief', 'premise', 'starting idea'], ['proof'], ['basic assumption', 'question an assumption', 'hidden assumption'], ['reasoning', 'evidence', 'argument'], ['assumption', 'assume']],
  ['logic', 'academic', 'education', ['reasoning', 'sense', 'clear thinking'], ['nonsense'], ['logical argument', 'clear logic', 'follow the logic'], ['evidence', 'principle', 'analysis'], ['logic', 'logical']],
  ['perspective', 'academic', 'education', ['viewpoint', 'angle', 'point of view'], ['blindness'], ['different perspective', 'student perspective', 'broader perspective'], ['opinion', 'context', 'argument'], ['perspective']],
  ['summary', 'academic', 'education', ['overview', 'brief', 'main points'], ['detail'], ['write a summary', 'brief summary', 'summary paragraph'], ['reading', 'note', 'report'], ['summary', 'summarize']],
  ['illustrate', 'academic', 'education', ['explain', 'show', 'demonstrate'], ['obscure'], ['illustrate a point', 'illustrate with examples', 'diagram illustrates'], ['example', 'diagram', 'explanation'], ['illustrate', 'illustration']],
  ['diagram', 'academic', 'education', ['chart', 'figure', 'visual map'], ['paragraph'], ['draw a diagram', 'diagram shows', 'simple diagram'], ['visual', 'structure', 'explanation'], ['diagram']],
  ['insight', 'academic', 'education', ['understanding', 'perception', 'clear view'], ['confusion'], ['gain insight', 'deep insight', 'useful insight'], ['analysis', 'experience', 'reflection'], ['insight', 'insightful']],
  ['trend', 'academic', 'education', ['direction', 'pattern', 'movement'], ['exception'], ['market trend', 'clear trend', 'trend analysis'], ['data', 'change', 'forecast'], ['trend']],
  ['accuracy', 'academic', 'education', ['precision', 'correctness', 'exactness'], ['error'], ['improve accuracy', 'high accuracy', 'accuracy rate'], ['measurement', 'data', 'quality'], ['accuracy', 'accurate']],
  ['decision', 'daily-life', 'general', ['choice', 'judgment', 'conclusion'], ['hesitation'], ['make a decision', 'final decision', 'decision process'], ['option', 'reason', 'priority'], ['decide', 'decision', 'decisive']],
  ['habit', 'daily-life', 'general', ['routine', 'custom', 'regular practice'], ['exception'], ['daily habit', 'learning habit', 'build a habit'], ['practice', 'routine', 'progress'], ['habit', 'habitual']],
  ['mistake', 'learning', 'education', ['error', 'fault', 'wrong answer'], ['accuracy'], ['common mistake', 'learn from mistakes', 'mistake analysis'], ['feedback', 'practice', 'review'], ['mistake', 'mistaken']],
  ['choice', 'daily-life', 'general', ['option', 'selection', 'alternative'], ['requirement'], ['make a choice', 'personal choice', 'choice between options'], ['decision', 'preference', 'reason'], ['choice', 'choose']],
  ['reason', 'communication', 'general', ['cause', 'explanation', 'basis'], ['result'], ['main reason', 'give a reason', 'reason for change'], ['evidence', 'decision', 'argument'], ['reason', 'reasonable']],
  ['journey', 'daily-life', 'general', ['trip', 'path', 'process'], ['stop'], ['learning journey', 'long journey', 'journey begins'], ['progress', 'experience', 'goal'], ['journey']],
  ['effort', 'learning', 'education', ['work', 'attempt', 'energy'], ['ease'], ['make an effort', 'extra effort', 'learning effort'], ['goal', 'progress', 'habit'], ['effort']],
  ['schedule', 'daily-life', 'general', ['timetable', 'plan', 'agenda'], ['delay'], ['weekly schedule', 'study schedule', 'schedule a meeting'], ['deadline', 'task', 'time'], ['schedule']],
  ['topic', 'communication', 'general', ['subject', 'theme', 'issue'], ['silence'], ['discussion topic', 'main topic', 'choose a topic'], ['question', 'reading', 'conversation'], ['topic']],
  ['feedback', 'learning', 'education', ['response', 'comment', 'advice'], ['silence'], ['teacher feedback', 'use feedback', 'feedback loop'], ['mistake', 'progress', 'revision'], ['feedback']],
  ['facility', 'business', 'business', ['site', 'service', 'workplace'], ['shortage'], ['training facility', 'facility manager', 'shared facility'], ['resource', 'project', 'equipment'], ['facility']],
  ['benefit', 'daily-life', 'general', ['advantage', 'gain', 'positive result'], ['drawback'], ['main benefit', 'health benefit', 'benefit from practice'], ['choice', 'result', 'value'], ['benefit', 'beneficial']],
  ['boundary', 'academic', 'education', ['limit', 'border', 'edge'], ['openness'], ['clear boundary', 'boundary line', 'set boundaries'], ['limit', 'space', 'responsibility'], ['boundary']],
  ['candidate', 'business', 'business', ['applicant', 'option', 'contender'], ['reject'], ['strong candidate', 'candidate list', 'select a candidate'], ['choice', 'evaluation', 'role'], ['candidate']],
  ['establish', 'academic', 'education', ['create', 'set up', 'prove'], ['remove'], ['establish a rule', 'establish evidence', 'establish a routine'], ['proof', 'system', 'foundation'], ['establish', 'establishment']],
  ['grant', 'business', 'business', ['allow', 'provide', 'award'], ['deny'], ['grant permission', 'research grant', 'grant access'], ['approval', 'resource', 'support'], ['grant']],
  ['process', 'academic', 'education', ['procedure', 'sequence', 'steps'], ['disorder'], ['learning process', 'process data', 'decision process'], ['workflow', 'method', 'system'], ['process']],
  ['distribution', 'business', 'business', ['spread', 'delivery', 'allocation'], ['collection'], ['data distribution', 'resource distribution', 'distribution channel'], ['network', 'supply', 'system'], ['distribution', 'distribute']],
  ['method', 'academic', 'education', ['approach', 'technique', 'procedure'], ['guess'], ['research method', 'learning method', 'method works'], ['process', 'strategy', 'evidence'], ['method', 'methodical']],
  ['challenge', 'learning', 'education', ['difficulty', 'obstacle', 'test'], ['ease'], ['face a challenge', 'learning challenge', 'challenge yourself'], ['goal', 'effort', 'strategy'], ['challenge', 'challenging']],
  ['create', 'learning', 'education', ['make', 'build', 'produce'], ['destroy'], ['create a plan', 'create content', 'create meaning'], ['design', 'idea', 'output'], ['create', 'creation', 'creative']],
  ['connect', 'communication', 'general', ['link', 'join', 'relate'], ['separate'], ['connect ideas', 'connect with people', 'connect data'], ['network', 'relationship', 'context'], ['connect', 'connection']],
  ['draft', 'learning', 'education', ['outline', 'version', 'early copy'], ['final copy'], ['first draft', 'draft a paragraph', 'rough draft'], ['writing', 'revision', 'feedback'], ['draft']],
  ['economy', 'business', 'business', ['market', 'system', 'financial life'], ['waste'], ['local economy', 'digital economy', 'economy grows'], ['business', 'trade', 'society'], ['economy', 'economic']],
  ['environment', 'daily-life', 'general', ['setting', 'surroundings', 'conditions'], ['vacuum'], ['learning environment', 'work environment', 'safe environment'], ['place', 'context', 'community'], ['environment', 'environmental']],
  ['indicator', 'academic', 'education', ['signal', 'measure', 'sign'], ['guess'], ['key indicator', 'performance indicator', 'indicator shows'], ['data', 'trend', 'evidence'], ['indicator', 'indicate']],
  ['heritage', 'academic', 'education', ['legacy', 'tradition', 'cultural memory'], ['novelty'], ['cultural heritage', 'heritage site', 'protect heritage'], ['history', 'culture', 'community'], ['heritage']],
  ['initiative', 'project-management', 'project', ['campaign', 'plan', 'new action'], ['inaction'], ['new initiative', 'learning initiative', 'initiative begins'], ['project', 'goal', 'strategy'], ['initiative']],
  ['alignment', 'project-management', 'project', ['agreement', 'arrangement', 'shared direction'], ['misalignment'], ['team alignment', 'goal alignment', 'alignment check'], ['priority', 'strategy', 'workflow'], ['alignment', 'align']],
  ['benchmark', 'business', 'business', ['standard', 'reference', 'comparison point'], ['guess'], ['performance benchmark', 'benchmark test', 'set a benchmark'], ['quality', 'metric', 'evaluation'], ['benchmark']],
  ['diagnosis', 'academic', 'education', ['identification', 'analysis', 'problem finding'], ['confusion'], ['diagnosis report', 'problem diagnosis', 'clear diagnosis'], ['evidence', 'cause', 'solution'], ['diagnosis', 'diagnose']],
  ['utility', 'technology', 'ai-tech', ['usefulness', 'service', 'practical value'], ['uselessness'], ['practical utility', 'utility tool', 'utility function'], ['value', 'system', 'service'], ['utility']],
  ['yield', 'academic', 'education', ['produce', 'give', 'generate'], ['resist'], ['yield results', 'yield data', 'high yield'], ['result', 'effect', 'output'], ['yield']],
  ['adaptation', 'academic', 'education', ['adjustment', 'change', 'new fit'], ['resistance'], ['language adaptation', 'adaptation process', 'successful adaptation'], ['change', 'context', 'learning'], ['adaptation', 'adapt']],
  ['agency', 'academic', 'education', ['power', 'organization', 'ability to act'], ['helplessness'], ['learner agency', 'public agency', 'agency grows'], ['choice', 'action', 'identity'], ['agency']],
]

export const GRAPH_READY_ENRICHMENT_BATCH_1: DictionaryGraphEnrichment[] = ROWS.map(makeEntry)
