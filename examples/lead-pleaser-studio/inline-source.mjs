// Preserve runtime strings while protecting script raw-text and preview-server injection.
export function inlineSource(source) {
  return source.replace(/<\/(script|body|head|html)/gi, '<\\/$1');
}
