
let elMock = { innerHTML: '', textContent: '' };
let labelHtml = '✨ Begin Turn';
if (!labelHtml.includes('<')) {
  elMock.textContent = labelHtml;
  elMock.innerHTML = labelHtml;
}
console.log('elMock:', elMock);
