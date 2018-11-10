import { event } from 'jwit';

export const loading = event();
export const loadingCapture = event();
export const load = event();
export const loadCapture = event();
export const error = event();
export const errorCapture = event();
export const aborted = event();
export const abortedCapture = event();
export const uploadProgress = event();
export const uploadProgressCapture = event();
export const downloadProgress = event();
export const downloadProgressCapture = event();