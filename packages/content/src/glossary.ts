export interface GlossaryTerm { id: string; term: string; definition: string; lesson: string }

export const glossary: GlossaryTerm[] = [
  { id: "token", term: "Token", definition: "A small piece of text, often a word or part of a word, that a language model reads and writes.", lesson: "1.2" },
  { id: "prompt", term: "Prompt", definition: "The text you give a model to continue or answer.", lesson: "1.1" },
  { id: "language-model", term: "Language model", definition: "A model that predicts the next token given the tokens before it.", lesson: "1.1" },
  { id: "probability", term: "Probability", definition: "How likely the model thinks each possible next token is.", lesson: "1.1" },
  { id: "tokenizer", term: "Tokenizer", definition: "The program that splits text into tokens and maps them to integer ids.", lesson: "1.2" },
  { id: "bpe", term: "Byte pair encoding (BPE)", definition: "A way to build a vocabulary by repeatedly merging the most frequent adjacent pair of symbols.", lesson: "1.2" },
  { id: "token-id", term: "Token id", definition: "The integer a token has in the tokenizer’s vocabulary. It is what the model actually receives.", lesson: "1.2" },
  { id: "embedding", term: "Embedding", definition: "A list of numbers that places a piece of text (or an image) as a point in space, so similar things sit close together.", lesson: "1.3" },
  { id: "vector", term: "Vector", definition: "An ordered list of numbers, often drawn as an arrow from the origin.", lesson: "1.3" },
  { id: "cosine-similarity", term: "Cosine similarity", definition: "A score from -1 to 1 for how closely two vectors point the same way.", lesson: "1.3" },
  { id: "context-window", term: "Context window", definition: "The maximum number of tokens a model can read at once, prompt and answer together.", lesson: "1.4" },
  { id: "input-cost", term: "Input cost", definition: "What you pay for the tokens you send to the model, usually priced per million tokens.", lesson: "1.4" },
];
