import { Parser } from './Parser'
import md5 from 'md5';

const EOL = '\n';

const ARRW_RH = '->';
const ARRW_TALE = '-';


const TOKEN_NODE = 'NODE';
const TOKEN_LINK = 'LINK';
const TOKEN_EOL = '↵';

export class SequenceParser extends Parser {
  constructor() {
    super()
  }

  reset() {
    super.reset();
    this.expected = [ARRW_TALE];
  }

  tokenize() {
    let indentation = this.readIndentation();
    let openArrow = null;

    while (this.pos < this.sourceLength) {
      switch(true) {


        case this.tryToken(ARRW_RH, buff => {
          this.expected = [EOL];
          openArrow.label = buff.trim()
          openArrow.rh = true;
          this.addToken({
            type: TOKEN_LINK,
            ...openArrow
          });
          openArrow = false;
        }): continue;



        case this.tryToken(ARRW_TALE, buff => {

            this.expected = [ARRW_RH];
            openArrow = {lh: false, style: 'MESSAGE'}
            this.addToken({
              type: TOKEN_NODE,
              content: buff.trim()
            })

        }): continue;



        case this.tryToken(EOL, buff => {
          this.expected = [ARRW_TALE];
          this.readIndentation(); //useless
          this.addToken({
            type: TOKEN_NODE,
            content: buff.trim()
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

    let node = {
      id: md5(firstToken.content),
      content: firstToken.content,
      blockType: 'timeline'
    }
    blocksMap.set(node.id, node);
    diagram.blocks.push(node);

    let lastNode = node;
    let relOpened = true;
    let lastLink = null;

    for (let token of this.tokens) {

      switch (token.type) {

        case TOKEN_LINK:
          let link =  {
            source: lastNode,
            target: null,
            lh: token.lh,
            rh: token.rh,
            label: token.label,
            style: token.style,
            index: diagram.links.length
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
              blockType: 'timeline'
            }
            blocksMap.set(node.id, node);
            diagram.blocks.push(node);
          }

          if (relOpened) {
            lastLink.target = node;
          } else {
            relOpened = true;
          }
          lastNode = node;
        break;

        case TOKEN_EOL:
          relOpened = false;
        break;
      }
    }
console.log(diagram);
    return diagram;

  }
}
