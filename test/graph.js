import {factory} from '../src/Factory';

import {expect, assert} from 'chai';

describe('graph parser parses correctly', () => {
  let parser = factory('graph');
  let script = `Foo -- Paf
Foo -cool- Paf
Foo --> Paf
Foo -cool-> Paf
Foo <-- Paf
Foo <-cool- Paf
Foo <--> Paf
Foo <-cool-> Paf
Zoo ~~ Gaz
Zoo ~cool~ Gaz
Zoo ~~> Gaz
Zoo ~cool~> Gaz
Zoo <~~ Gaz
Zoo <~cool~ Gaz`;

  let data = parser.parseText(script);
  console.log(data);
  it ('produces correct object structure', () => {

      expect(data).to.have.keys(['blocks', 'links', 'tree']);

      expect(data.blocks)
        .to.be.a('array')
        .to.have.lengthOf(4);
      expect(data.links)
        .to.be.a('array')
        .to.have.lengthOf(14);

  })

  // it ('creates correct #id object structure', () => {
  //     expect(data.blocks[1]).to.have.property('id', 'foo');
  // })

})
