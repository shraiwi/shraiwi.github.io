export default class MarkdownFrame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._content = '';
        this._src = '';
        this._observer = new MutationObserver(this._handleMutations.bind(this));

        // Set up marked with GFM and syntax highlighting
        marked.setOptions({
            gfm: true,
            breaks: true,
            highlight: function (code, lang) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            }
        });
    }

    connectedCallback() {
        this._content = this.textContent;
        this.render();
        this._observer.observe(this, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    disconnectedCallback() {
        this._observer.disconnect();
    }

    static get observedAttributes() {
        return ['src'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'src' && oldValue !== newValue) {
            this._src = newValue;
            this.fetchAndRender();
        }
    }

    async fetchAndRender() {
        try {
            const response = await fetch(this._src);
            this._content = await response.text();
            this.render();
        } catch (error) {
            console.error('Error fetching Markdown:', error);
            this.dispatchEvent(new CustomEvent('error', { 
                detail: { error },
                bubbles: true,
                composed: true
            }));
        }
    }

    _dispatchRenderedEvent() {
        this.dispatchEvent(new CustomEvent('rendered', {
            detail: { 
                content: this._content,
                element: this.shadowRoot.querySelector('.rendered')
            },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          .hljs { background: #f0f0f0; padding: 0.5em; border-radius: 0.3em; }
        </style>
        <link rel="stylesheet" href="md.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/styles/default.min.css">
        <div class="rendered"></div>
      `;
        this.updateRenderedContent();
    }

    updateRenderedContent() {
        const renderedDiv = this.shadowRoot.querySelector('.rendered');
        renderedDiv.innerHTML = marked.parse(this._content);
        this._dispatchRenderedEvent();
    }

    get innerText() {
        return this._content;
    }

    set innerText(value) {
        this._content = value;
        this.textContent = value;
        this.updateRenderedContent();
    }

    get innerHTML() {
        return this._content;
    }

    set innerHTML(value) {
        this._content = value;
        this.textContent = value;
        this.updateRenderedContent();
    }

    _handleMutations(mutations) {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                this._content = this.textContent;
                this.updateRenderedContent();
                break;
            }
        }
    }

    static define(tagName = 'md-frame') {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, this);
        }
    }
}