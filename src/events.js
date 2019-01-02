import { event } from 'jwit';

export const loading = event();
export const loadingCapture = event();
export const load = event();
export const loadCapture = event();
export const error = event();
export const errorCapture = event();
export const abort = event();
export const abortCapture = event();
export const uploadProgress = event();
export const uploadProgressCapture = event();
export const downloadProgress = event();
export const downloadProgressCapture = event();
export const response = event();
export const responseCapture = event();
export const done = event();
export const doneCapture = event();