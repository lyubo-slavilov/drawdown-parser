import { Parser } from './Parser'
import md5 from 'md5';

const EOL = '\n';
const ARRW_LH = '<-';
const ARRW_LH_C = '<~';
const ARRW_RH = '->';
const ARRW_RH_C = '~>';
const ARRW_TALE = '-';
const ARRW_TALE_C = '~';

const TOKEN_NODE = 'NODE';
const TOKEN_LINK = 'LINK';
const TOKEN_EOL = '↵';

export class GraphParser extends Parser {
  constructor() {
    super()
  }

  reset() {
    super.reset();
    this.expected = [ARRW_LH, ARRW_LH_C, ARRW_TALE, ARRW_TALE_C];
  }

  tokenize() {
    let indentation = this.readIndentation();
    let openArrow = null;

    while (this.pos < this.sourceLength) {
      switch(true) {

        case this.tryToken(ARRW_LH, buff => {
          this.expected = [ARRW_RH, ARRW_TALE];
          this.addToken({
            type: TOKEN_NODE,
            content: buff
          });
          openArrow = {lf: true, style: '-'}
        }): continue;

        case this.tryToken(ARRW_LH_C, buff => {
          this.expected = [ARRW_RH_C, ARRW_TALE_C];
          this.addToken({
            type: TOKEN_NODE,
            content: buff
          });
          openArrow = {lf: true, style: '~'}
        }): continue;

        case this.tryToken(ARRW_RH, buff => {
          this.expected = [EOL];
          openArrow.label = buff
          openArrow.rh = true;
          this.addToken({
            type: TOKEN_LINK,
            ...openArrow
          });
          openArrow = false;
        }): continue;

        case this.tryToken(ARRW_RH_C, buff => {
          this.expected = [EOL];
          openArrow.label = buff
          openArrow.rh = true;
          this.addToken({
            type: TOKEN_LINK,
            ...openArrow
          });
          openArrow = false;
        }): continue;

        case this.tryToken(ARRW_TALE, buff => {
          if (openArrow) {
            this.expected = [EOL];
            openArrow.label = buff;
            openArrow.rf = false;
            this.addToken({
              type: TOKEN_LINK,
              ... openArrow
            });
            openArrow = null;
          } else {
            this.expected = [ARRW_RH, ARRW_TALE];
            openArrow = {lf: false, style: '-'}
            this.addToken({
              type: TOKEN_NODE,
              content: buff
            })
          }
        }): continue;

        case this.tryToken(ARRW_TALE_C, buff => {
          if (openArrow) {
            this.expected = [EOL];
            openArrow.label = buff;
            openArrow.rf = false;
            this.addToken({
              type: TOKEN_LINK,
              ... openArrow
            });
            openArrow = null;
          } else {
            this.expected = [ARRW_RH_C, ARRW_TALE_C];
            openArrow = {lf: false, style: '~'}
            this.addToken({
              type: TOKEN_NODE,
              content: buff
            })
          }
        }): continue;

        case this.tryToken(EOL, buff => {
          this.expected = [ARRW_LH,  ARRW_LH_C,  ARRW_TALE, ARRW_TALE_C];
          this.readIndentation(); //useless
          this.addToken({
            type: TOKEN_NODE,
            content: buff
          });
          this.addToken({
            type: TOKEN_EOL
          })
          openArrow = null;
        }): continue;

      }
      this.read(1);
    }
    if (this.tokens[this.tokens.length - 1].type != TOKEN_EOL) {
      throw 'Unexpected end of text. Expecting ↵';
    }
  }

  processTokenStream() {

    let diagram = {
      links: [],
      blocks: [],
      tree: {children: []}
    }

    let blocksMap = new Map();

    let firstToken = this.tokens.shift();
    if (firstToken.type != TOKEN_NODE) {
      throw `Unexpected token of type ${firstToken.type}`;
    }

    node = {
      id: md5(firstToken.content),
      content: firstToken.content,
      blockType: 'node'
    }
    blocksMap.set(node.id, node);
    diagram.blocks.push(node);

    let lastNode = node;
    let openedRelNode = node;
    let lastLink = null;

    for (let token of this.tokens) {

      switch (token.type) {

        case TOKEN_LINK:
          let link =  {
            source: lastNode,
            target: null,
            ... token
          }
          diagram.links.push(link);
          lastLink = link;
        break;

        case TOKEN_NODE:
          let node;
          node = blocksMap.get(md5(token.content));
          if (!node) {
            node = {
              id: md5(token.content),
              content: token.content,
              blockType: 'node'
            }
            blocksMap.set(node.id, node);
            diagram.blocks.push(node);
          }

          if (openedRelNode) {
            lastLink.target = node;
          } else {
            openedRelNode = node;
          }
          lastNode = node;
        break;

        case TOKEN_EOL:
          openedRelNode = null;
        break;
      }
    }

    return diagram;

  }
}
