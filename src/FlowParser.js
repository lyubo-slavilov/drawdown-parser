import { Parser } from './Parser';

const PIPE = '-';
const STOP = '.'
const COND = '?';
const CASE = ':'
const ARRW = '-->';
const WRRA = '<--';
const IDOB = '{';
const IDCB = '}';
const EOL = '\n';


const NODE_ARRW = ARRW;
const NODE_BLOCK = 'BLOCK';
const NODE_ID = 'ID';
const NODE_WRRA = WRRA;
const NODE_CASE = 'CASE';
const NODE_EOL = 'EOL';

const BLOCK_TYPE_PROCESS = 'PROCESS';
const BLOCK_TYPE_CONDITION = 'CONDITION';

export class FlowParser extends Parser {
  constructor(){
    super();
  }
  reset() {
    super.reset();
    this.expected = [PIPE]
  }

  addToken(token) {
    token.id = `#node-${this.tokens.length}`;
    this.tokens.push(token);
  }

  tokenize() {
    let indentation = this.readIndentation();
    while (this.pos < this.sourceLength) {
      switch(true) {

        case this.tryToken(ARRW, buff => {
          this.expected = [STOP, IDOB];
          this.addToken({
            type: NODE_ARRW
          });
        }): continue;

        case this.tryToken(WRRA, buff => {
          this.expected = [IDOB]; //TODO handle fromREF
          this.addToken({
            type: NODE_WRRA
          });
          //TODO create FORK

        }): continue;

        case this.tryToken(PIPE, buff => {
          this.expected = [STOP, COND, CASE, ARRW];
        }): continue;

        case this.tryToken(STOP, buff => {
          this.expected = [EOL, IDOB, WRRA, ARRW]
          this.addToken({
            type: NODE_BLOCK,
            blockType: BLOCK_TYPE_PROCESS,
            indent: indentation.length,
            content: buff + '.'
          });
        }): continue;

        case this.tryToken(COND, buff => {
          this.expected = [EOL, IDOB, WRRA, ARRW] //TODO LEFTOVERS
          this.addToken({
            type: NODE_BLOCK,
            blockType: BLOCK_TYPE_CONDITION,
            indent: indentation.length,
            content: buff + '?',
          });
        }): continue;

        case this.tryToken(CASE, buff => {
          this.expected = [EOL] //TODO LEFTOVERS
          this.addToken({
            type: NODE_CASE,
            indent: indentation.length,
            content: buff,
          });
        }): continue;


        case this.tryToken(IDOB, (buff) => {
          //TODO buff must be empty or whitespaces
          this.expected = [IDCB];
        }): continue;

        case this.tryToken(IDCB, (buff) => {
          //TODO validate id
          this.expected = [WRRA, EOL];
          this.addToken({
            type: NODE_ID,
            content: buff
          });
        }): continue;

        case this.tryToken(EOL, (buff) => {
          this.expected = [PIPE, ARRW];
          indentation = this.readIndentation();
          this.addToken({
            type: NODE_EOL
          })
        }): continue;

      }

      this.read(1);
    }
  }

  processTokenStream() {
    let diagram = {
      blocks: [],
      links: [],
      forks: []
    }
    let stack = [];
    let treeStack = [];
    let tree = {
      children: []
    };

    let blocksMap = new Map();

    //Handle first node
    let firstNode = this.tokens.shift();
    if (firstNode.type != NODE_BLOCK) {
      throw `Expecting node of type block. Node of type ${firstNode.type} found`;
    }
    firstNode.blockType = firstNode.blockType == EOL ? STOP : firstNode.blockType;

    if (firstNode.blockType != BLOCK_TYPE_PROCESS) {
      throw `Expecting block of type ${BLOCK_TYPE_PROCESS}. Block of type ${firstNode.blockType} found`;
    }
    diagram.blocks.push(firstNode);
    blocksMap.set(firstNode.id, firstNode);
    let latestNode = firstNode;
    let latestBlock = firstNode;
    let lastIdent = 0;
    let eolOpen = true;
    let latestTreeParent = {
      d: latestBlock,
      children: []
    }
    tree.children.push(latestTreeParent);

    for (let node of this.tokens) {

      if (node.indent !== undefined) {
        if (node.indent > lastIdent) {
          stack.push(latestBlock)
          treeStack.push(latestTreeParent)
        } else if (node.indent < lastIdent) {
          latestBlock = stack.pop();
          latestTreeParent = treeStack.pop();
          while (latestBlock.indent > node.indent) {
            latestBlock = stack.pop();
            latestTreeParent = treeStack.pop();
            if (!latestBlock) {
              throw 'Identention problem';
            }
          }

        }
        lastIdent = node.indent;
      }

      try {
        switch (node.type) {

          case NODE_ARRW :
            //TODO varify latestNode is a BLOCK
            if (eolOpen) {
              diagram.links.push({
                source: latestBlock,
                target: null,
                label: latestNode.type == NODE_CASE ? latestNode.content : '',
                lh: false,
                rh: true,
                style: '-'
              })
            } else {
              diagram.forks.push({
                after: latestBlock,
                target: null
              });
            }
            break;

          case NODE_BLOCK:
            if (latestNode.type == NODE_ARRW) {
              diagram.forks[diagram.forks.length-1].target = node
              tree.children.push({
                d: node,
                children:[] //We do not expect childrens, thought
              });
              //forked block. Do not make this latest block!
            } else {
              let label = latestNode.type == NODE_CASE ? latestNode.content : ''
              diagram.links.push({
                source: latestBlock,
                target: node,
                label: latestNode.type == NODE_CASE ? latestNode.content : '',
                lh: false,
                rh: true,
                style: '-'
              });
              latestBlock = node;
              let treeNode = {
                d: latestBlock,
                children: []
              }
              latestTreeParent.children.push(treeNode)
              latestTreeParent = treeNode;
            }
            diagram.blocks.push(node);
            blocksMap.set(node.id, node);
            eolOpen = true;
            break;

          case NODE_ID:

            if (latestNode.type == NODE_ARRW) {
              diagram.links[diagram.links.length -1].target = node.content
            }

            if (latestNode.type == NODE_WRRA) {
              diagram.links[diagram.links.length - 1].source = node.content
            }
            if (latestNode.type == NODE_BLOCK) {
              //TODO: verify latest node IS A BLOCK OR WRRA
              latestNode.id = node.content;
              blocksMap.set(latestNode.id, latestNode);
            }
            break;

          case NODE_WRRA:
            diagram.links.push({
              source: null, //wait for the next block id
              target: latestBlock,
              lh: false,
              rh: true,
              style: '-'
            });
            break;

          case  NODE_EOL:
            eolOpen = false;
            continue; // do not store EOL into latestNode
        }
      } catch (e) {
        console.error(`Error with node`, node);
        throw e;
      }

      latestNode = node;

    }
    //resolve links
    for (let link of diagram.links) {
      try {
        if (link.source.constructor == String) {
          let block = blocksMap.get(link.source);
          if (block == null) {
            throw `Can not find link source block#{${link.source}} `;
          }
          link.source = block;
        }
        if (link.target.constructor == String) {
          let block = blocksMap.get(link.target);
          if (block == null) {
            throw `Can not find link target block#{${link.target}} `;
          }
          link.target = block;
        }
      } catch (e) {
        console.error('Error with link', link);
        throw `Cant resolve links`
      }
    }

    //resolve forks
    for (let fork of diagram.forks) {
      try {
        if (fork.target.constructor == String) {
          let block = blocksMap.get(link.source);
          if (block == null) {
            throw `Can not find fork target block#{${fork.target}} `;
          }
          fork.target = block;
        }
      } catch (e) {
        console.error('Error with fork', fork);
        throw `Cant resolve forks`;
      }
    }
    diagram.tree = tree;
    return diagram;
  }
}
