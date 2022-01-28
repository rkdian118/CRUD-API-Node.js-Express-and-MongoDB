const aposToLexFrom = require('apos-to-lex-form');
const {
    WordTokenizer,
    PorterStemmer,
    SentimentAnalyzer
} = require('natural');
const SpellCorrector = require('spelling-corrector');
const stopWord = require('stopword')


const tokenizer = new WordTokenizer();
const spellCorrector = new SpellCorrector();
spellCorrector.loadDictionary();

const analyzer = new SentimentAnalyzer('English', PorterStemmer, "afinn");

async function getSentiment(str) {
    if (!str.trim()) {
        return 0;
    }
    const lexed = await aposToLexFrom(str).toLowerCase().replace(/[^a-zA-Z\s]+/g, ""); {

        const tokenized = tokenizer.tokenize(lexed)

        const fixedSpelling = tokenized.map((word) => spellCorrector.correct(word))

        const stopWordsRemoved = stopWord.removeStopwords(fixedSpelling)

        console.log(stopWordsRemoved)

        const analyze = analyzer.getSentiment(stopWordsRemoved);

        console.log(analyze)
    }
}

getSentiment('Dune is not coming back to IMAX this weekend')