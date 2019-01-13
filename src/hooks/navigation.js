import { wrapFactory } from 'jwit';
import hookAnchors from './anchors';
import hookForms from './form';
import hookSubmits from './submit';

export default wrapFactory(() => [
  hookAnchors(),
  hookForms(),
  hookSubmits(),
]);