import { hook } from 'jwit';

import { AnchorHook } from './anchors';
import { FormHook } from './form';
import { InputHook } from './input';
import { NoWKHook } from './nowk';
import { ScrollHook } from './scroll';
import { RmHook } from './rm';
import { DisabledHook } from './disabled';
import { SubmitHook } from './submit';
import { WokSubHook } from './wsub';

export default () => {
  hook(AnchorHook)
  hook(FormHook)
  hook(InputHook)
  hook(NoWKHook)
  hook(ScrollHook)
  hook(RmHook)
  hook(SubmitHook)
  hook(WokSubHook)
  hook(DisabledHook)
}