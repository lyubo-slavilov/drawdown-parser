'use babel';

export class Parser {

  constructor() {
    this.reset();
  }
  replaceAll(string, needle, replacement) {
    return string.split(needle).join(replacement)
  }
  reset() {
    this.source = '';
    this.pos = 0;
    this.buff = '';
    this.expected = [];
    this.tokens = [];
  }

  lookAhead(len) {
    if (this.pos + len > this.sourceLength) {
      return "";
    }
    let s = '';
    for (let i = 0; i < len; i++) {
      s += this.source[this.pos + i];
    }
    return s;
  }

  read(len) {
    let s = ''
    for (let i =0; i < len; i++) {
      if (this.source[this.pos] == '\\') {
        this.pos++;
      }
      s += this.source[this.pos + i];
    }
    this.buff += s;
    this.pos += len;
    return s;
  }

  readIndentation() {
    let indentation = '';
    let nextChar = '';

    nextChar = this.lookAhead(1);
    while (nextChar == ' ' || nextChar == '\t') {
      this.mv(1);
      indentation += nextChar;
      nextChar = this.lookAhead(1);
    }
    return indentation;
  }

  mv(stp) {
    this.pos += stp;
  }

  exp(token) {
    return this.expected.indexOf(token) >= 0;
  }

  buffDump() {
    let buff = this.buff;
    this.buff = '';
    return buff;
  }

  parseText(text) {
    this.reset();
    this.source = text + '\n';
    this.sourceLength = this.source.length;
    this.tokenize();
    let result = this.processTokenStream();
    return result;
  }

  tryToken(token, callback) {

    if (this.lookAhead(token.length) == token) {
      if (this.exp(token)) {
        //remove the token from the expected token list

        this.mv(token.length);
        callback(this.buffDump())
      } else {

        let near = this.replaceAll(this.source.substring(this.pos - 16, this.pos + 1), '\n', '↵\n') + ' <---';
        let tokenStr = this.replaceAll(token, '\n',  '↵');
        let expectingStr = this.replaceAll(this.expected.join(' or '), '\n',  '↵');

        let message = `Unexpected ${tokenStr}. Expecting ${expectingStr}, near:\n${near}`;
        throw message;
      }
      return true;
    }
    return false;
  }

  addToken(token) {
    token.id = `#token-${this.tokens.length}`;
    this.tokens.push(token);
  }

  tokenize() {
    console.error('It seems tokenize() is not implemented');
  }

  processTokenStream()
  {
    console.error('It seems processTokenStream() is not implemented');
  }
}
