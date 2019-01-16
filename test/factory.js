import {factory} from '../src/Factory';
import {FlowParser} from '../src/FlowParser';
import {GraphParser} from '../src/GraphParser';

import {expect, assert} from 'chai';

describe('parser factory', function () {
    it('creates flow parser', function () {
        let flow = factory('flow');
        expect(flow).to.be.a('object');
        assert.instanceOf(flow, FlowParser);
    });
    it('creates graph parser', function () {
        let graph = factory('graph');
        expect(graph).to.be.a('object');
        assert.instanceOf(graph, GraphParser);
    });
    it('throws on unknown parser', function () {
        expect(() => {
          factory('RediculousParserNameHere');
        }).to.throws('Unknown Drawdown diagram "rediculousparsernamehere"')
    });
});

// describe('utils sortObject', function () {
//     it('works', function () {
//         expect(sortObject({
//             B: 1, b: 1, a: 1, A: 1
//         })).to.eql({
//             a: 1, b: 1, A: 1, B: 1
//         });
//     });
// });
