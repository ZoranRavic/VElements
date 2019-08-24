
export interface IElementBase
{
    toString(): string;
    toElement(): Node;
}

export type ChildType = IElementBase | string | number | boolean | null | undefined;

export interface IAttributes
{
    id?: string;
    class?: string;
    className?: string;
    style?: string;
    [attr:string]: string | { [attr:string]: string } | any;
}

export const createElement = (name: string | [string, string], attrs?: IAttributes, ...children: Array<ChildType|Array<ChildType>>): VElement =>
    new VElement(name, attrs, ...children);

export default createElement;

export const h = createElement;

export class VElement implements IElementBase
{
    public namespace?: string;
    public name: string;
    public attrs: IAttributes;
    public children: Array<ChildType>;

    constructor(name: string | [string, string], attrs?: IAttributes, ...children: Array<ChildType|Array<ChildType>>)
    {
        if (Array.isArray(name))
        {
            this.namespace = name[0];
            this.name = name[1];
        }
        else if (svgElementNames.indexOf(name) >= 0)
        {
            this.namespace = 'http://www.w3.org/2000/svg';
            this.name = name;
        }
        else
        {
            this.name = name;
        }
        this.attrs = {};
        if (attrs && typeof attrs === 'object')
        {
            for (let attr in attrs)
            {
                const value = attrs[attr];
                if (value != null)
                {
                    if (typeof value === 'object')
                    {
                        const ns = attr.indexOf('http') == 0 ? attr : 'http://www.w3.org/1999/' + attr;
                        for (const nsAttr in value)
                        {
                            if (value[nsAttr] != null)
                            {
                                this.attrs[ns] = this.attrs[ns] || {};
                                this.attrs[ns][nsAttr] = '' + value[nsAttr];
                            }
                        }
                    }
                    else
                    {
                        if (attr === 'className')
                        {
                            attr = 'class';
                        }
                        this.attrs[attr] = stringAttrs.indexOf(attr) >= 0 ? '' + value : value;
                    }
                }
            }
        }
        this.children = [];
        for (const child of children)
        {
            if (Array.isArray(child))
            {
                this.children.push(...child);
            }
            else
            {
                this.children.push(child);
            }
        }
    }

    public attr(attr: string): string;
    public attr(attr: string, val: any): this;
    public attr(attr: string, val?: any): this | string
    {
        if (arguments.length == 1)
        {
            return this.attrs[attr] as any;
        }
        else
        {
            this.attrs[attr] = '' + val;
            return this;
        }
    }

    public data(attr: string): string | undefined;
    public data(attr: string, val: any): this;
    public data(attr: string, val?: any): this | string | undefined | any
    {
        if (arguments.length == 1)
        {
            return this.attrs['data-' + attr];
        }
        else
        {
            this.attrs['data-' + attr] = val;
            return this;
        }
    }

    public attrNS(namespace: string, attr: string): string | undefined;
    public attrNS(namespace: string, attr: string, val: any): this;
    public attrNS(namespace: string, attr: string, val?:  any): this | string | undefined | any
    {
        const ns = namespace.indexOf('http') == 0 ? namespace : 'http://www.w3.org/1999/' + namespace;
        if (arguments.length == 2)
        {
            return this.attrs[ns] ? this.attrs[ns][attr] : undefined;
        }
        else
        {
            this.attrs[ns] = this.attrs[ns] || {};
            this.attrs[ns][attr] = val;
            return this;
        }
    }

    public append(node: VElement): this
    {
        this.children.push(node);
        return this;
    }

    public remove(node: VElement): this
    {
        const index = this.children.indexOf(node);
        if (index >= 0)
        {
            this.children.splice(index, 1);
        }
        return this;
    }

    public get innerHTML(): string
    {
        return this.children.join('');
    }

    public get outerHTML(): string
    {
        return this.toString();
    }

    public toString(): string
    {
        let attrsStr = '';
        for (const attr in this.attrs)
        {
            const value = this.attrs[attr];
            if (value != null)
            {
                if (typeof value === 'object')
                {
                    for (const nsAttr in value)
                    {
                        if (value[nsAttr] != null)
                        {
                            attrsStr += ` ${attr}:${nsAttr}="${value[nsAttr]}"`;
                        }
                    }
                }
                else
                {
                    attrsStr += ` ${attr}="${value}"`;
                }
            }
        }
        return this.children.length == 0 ?
            `<${this.name}${attrsStr}/>` :
            `<${this.name}${attrsStr}>${this.children.join('')}</${this.name}>`;
    }

    public toElement(): HTMLElement | SVGElement | Element
    {
        const element = this.namespace ?
            document.createElementNS(this.namespace, this.name) :
            document.createElement(this.name);
        for (const attr in this.attrs)
        {
            const value = this.attrs[attr];
            if (value != null)
            {
                if (typeof value === 'object')
                {
                    for (const nsAttr in value)
                    {
                        if (value[nsAttr] != null)
                        {
                            element.setAttributeNS(attr, nsAttr, value[nsAttr]);
                        }
                    }
                }
                else if (typeof value === 'function')
                {
                    const event = attr.indexOf('on') == 0 ? attr.substr(2).toLowerCase() : attr;
                    element.addEventListener(event, value);
                }
                else
                {
                    element.setAttribute(attr, value);
                }
            }
        }
        for (const child of this.children)
        {
            if (child != null && child !== false)
            {
                if (isElementBase(child))
                {
                    element.appendChild(child.toElement());
                }
                else
                {
                    element.appendChild(document.createTextNode(''+child));
                }
            }
        }
        return element;
    }

    public toReactElement();
    public toReactElement(React: {createElement: Function});
    public toReactElement(createElement: Function);
    public toReactElement(React?)
    {
        if (!React)
        {
            // @ts-ignore
            React = require('react'+'');
        }
        const children = [];
        for (const child of this.children)
        {
            if (child instanceof VElement)
            {
                children.push(child.toReactElement(React));
            }
            else if (!(child instanceof VComment))
            {
                children.push(child);
            }
        }
        const attrs = {};
        for (const name in this.attrs)
        {
            const reactName = name.indexOf('data-') == 0 || name.indexOf('aria-') == 0 ?
                name : name.replace(/-(.)/, c => c.toUpperCase()[1]);
            attrs[reactName] = this.attrs[name];
        }
        return (React.createElement || React)(this.name, attrs, ...children);
    }

    public get id(): string
    {
        return this.attrs.id;
    }
    public set id(id: string)
    {
        this.attrs.id = id;
    }

    public get className(): string
    {
        return this.attrs.class;
    }
    public set className(className: string)
    {
        this.attrs.class = className;
    }

    public addClasses(...names: Array<string>): this
    {
        if (this.attrs.class)
        {
            const list = this.attrs.class.split(' ');
            for (const name of names)
            {
                if (list.indexOf(name) < 0)
                {
                    list.push(name);
                }
            }
            this.attrs.class = list.join(' ');
        }
        else
        {
            this.attrs.class = names.join(' ');
        }
        return this;
    }

    public removeClasses(...names: Array<string>): this
    {
        if (this.attrs.class)
        {
            const list = this.attrs.class.split(' ');
            for (const name of names)
            {
                const index = list.indexOf(name);
                if (list.indexOf(name) >= 0)
                {
                    list.splice(index, 1);
                }
            }
            this.attrs.class = list.join(' ');
        }
        return this;
    }

    public hasClasses(...names: Array<string>): boolean
    {
        if (this.attrs.class)
        {
            const list = this.attrs.class.split(' ');
            for (const name of names)
            {
                if (list.indexOf(name) < 0)
                {
                    return false;
                }
            }
            return true;
        }
        return names.length == 0;
    }

    public style(): { [attr:string]: string };
    public style(name: string): string;
    public style(name: string, val: any): this;
    public style(name?: string, val?: any): this | string | { [attr:string]: string }
    {
        const list = this.attrs.style ? this.attrs.style.split(';') : [];
        const style: { [attr:string]: string } = {};
        for (const item of list)
        {
            const i = item.indexOf(':');
            if (i >= 0)
            {
                style[item.substring(0, i).trim()] = item.substring(i + 1).trim();
            }
        }
        if (arguments.length == 0)
        {
            return style;
        }
        else if (arguments.length == 1)
        {
            return style[name];
        }
        else
        {
            style[name] = '' + val;
            let res = '';
            for (const key in style)
            {
                res += key + ':' + style[key] + ';';
            }
            this.attrs.style= res;
            return this;
        }
    }
}

export class VComment implements IElementBase
{
    public text: string;

    constructor(text?: string)
    {
        this.text = text;
    }

    public toString(): string
    {
        return `<!-- ${this.text != null ? this.text : ''} -->`;
    }

    public toElement(): Comment
    {
        return document.createComment(this.text != null ? this.text : '');
    }
}

export function isElementBase(element): element is IElementBase
{
    return element && typeof element === 'object' && typeof element.toElement === 'function';
}

const stringAttrs = ['id', 'class', 'style'];

const svgElementNames = [
    'a',
    'altGlyph',
    'altGlyphDef',
    'altGlyphItem',
    'animate',
    'animateColor',
    'animateMotion',
    'animateTransform',
    'circle',
    'clipPath',
    'color-profile',
    'cursor',
    'defs',
    'desc',
    'discard',
    'ellipse',
    'feBlend',
    'feColorMatrix',
    'feComponentTransfer',
    'feComposite',
    'feConvolveMatrix',
    'feDiffuseLighting',
    'feDisplacementMap',
    'feDistantLight',
    'feDropShadow',
    'feFlood',
    'feFuncA',
    'feFuncB',
    'feFuncG',
    'feFuncR',
    'feGaussianBlur',
    'feImage',
    'feMerge',
    'feMergeNode',
    'feMorphology',
    'feOffset',
    'fePointLight',
    'feSpecularLighting',
    'feSpotLight',
    'feTile',
    'feTurbulence',
    'filter',
    'font',
    'font-face',
    'font-face-format',
    'font-face-name',
    'font-face-src',
    'font-face-uri',
    'foreignObject',
    'g',
    'glyph',
    'glyphRef',
    'hatch',
    'hatchpath',
    'hkern',
    'image',
    'line',
    'linearGradient',
    'marker',
    'mask',
    'mesh',
    'meshgradient',
    'meshpatch',
    'meshrow',
    'metadata',
    'missing-glyph',
    'mpath',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'radialGradient',
    'rect',
    'script',
    'set',
    'solidcolor',
    'stop',
    'style',
    'svg',
    'switch',
    'symbol',
    'text',
    'textPath',
    'title',
    'tref',
    'tspan',
    'unknown',
    'use',
    'view',
    'vkern',
];
