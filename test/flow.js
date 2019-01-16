import {factory} from '../src/Factory';

import {expect, assert} from 'chai';

describe('flow parser parses correctly', () => {
  let parser = factory('flow');
  let script = `- Start.
- Node 1. {foo}
- Node 2.
- End.`
  let data = parser.parseText(script);

  it ('produces correct object structure', () => {

      expect(data).to.have.keys(['blocks', 'links', 'forks', 'tree']);

      expect(data.blocks)
        .to.be.a('array')
        .to.have.lengthOf(4);
      expect(data.links)
        .to.be.a('array')
        .to.have.lengthOf(3);
      expect(data.forks)
        .to.be.a('array')
        .to.have.lengthOf(0);

  })

  it ('creates correct #id object structure', () => {
      expect(data.blocks[1]).to.have.property('id', 'foo');

  })

})
