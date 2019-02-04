import { wrapFactory } from 'jwit';

import hookScroll from './scroll';
import hookAnchors from './anchors';
import hookSubmits from './submit';
import hookForms from './form';
import hookInputs from './input';
import hookWS from './wsub';

export default wrapFactory(() => [
  hookScroll(),
  hookAnchors(),
  hookSubmits(),
  hookForms(),
  hookInputs(),
  hookWS(),
])