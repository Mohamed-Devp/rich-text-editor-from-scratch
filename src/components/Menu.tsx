import React from "react";
import fonts from "../data/fonts.json";

// Interfaces
import { Line, Component } from "../interfaces";

// Components
import DropDown from "./DropDown";
import ColorSelector from "./ColorSelector";

// Contexts
import useTextModelCtx from "../context/TextModelCtx";

const Menu: React.FC = () => {
    const { textModelRef, savedRangeRef, renderTextModel } = useTextModelCtx();

    // Return a list of multiples for 4 start from start to end
    const loadFontSizes = (start: number, end: number) => {
        const sizes = [];
        for (let i = start; i <= end; i += 4) {
            sizes.push(String(i));
        }

        return sizes;
    }

    const updateCommands = (cmds: Array<string>, cmd: string) => {
        if (cmds.includes(cmd)) {
            return cmds.includes(cmd)
                ? cmds.filter(prevCmd => prevCmd !== cmd)
                : [...cmds, cmd];
        }

        const [cmdType, cmdVal] = cmd.split('_');

        // Remove existing commands that share the same type as cmd
        let updated = cmds.filter(prevCmd => {
            const [prevType, prevVal] = prevCmd.split('_');
            if (cmdType === 'STYLE' && prevType === 'STYLE') {
                return prevVal !== cmdVal;
            }
            return cmdType !== prevType;
        });

        updated = [...updated, cmd];
        return updated;
    }

    // Apply the given command to a specific component
    const applyToComponent = (
        cmd: string,
        component: HTMLSpanElement,
        options?: { startOffset?: number, endOffset?: number }
    ) => {
        const { startOffset, endOffset } = options || {};

        const textModel = textModelRef.current;
        const range = savedRangeRef.current;

        // Get the line index and component index and the component content from component
        const lineIdx = Number(component.parentElement?.dataset.index);
        const componentIdx = Number(component.dataset.index);
        const content = component.textContent || '';
        
        if (Number.isNaN(lineIdx) || Number.isNaN(componentIdx)) {
            return;
        }

        // Updated the applied commands to component
        const prev = textModel[lineIdx].components[componentIdx].applied;
        const cur = updateCommands(prev, cmd);

        // Slice the component content based on the gievn offset
        let updatedComponents: Array<Component> = [];
        if (startOffset !== undefined) {
            if (startOffset === Infinity) {
                updatedComponents.push({ content, applied: cur });

            } else {
                const first = { content: content.slice(0, startOffset), applied: prev };
                const second = { content: content.slice(startOffset), applied: cur };

                [first, second].forEach(updatedComponent => {
                    if (updatedComponent.content) updatedComponents.push(updatedComponent);
                });
            }
        } else if (endOffset !== undefined) {
            const first  = { content: content.slice(0, endOffset), applied: cur };
            const second = { content: content.slice(endOffset), applied: prev };

            [first, second].forEach(updatedComponent => {
                if (updatedComponent.content) updatedComponents.push(updatedComponent);
            });

        } else {
            const { startOffset, endOffset } = range;

            const before = { content: content.slice(0, startOffset), applied: prev };
            const selected = { content: range.toString(), applied: cur};
            const after = { content: content.slice(endOffset), applied: prev };

            [before, selected, after].forEach(updatedComponent => {
                if (updatedComponent.content) updatedComponents.push(updatedComponent);
            });
        }

        let upadted: Line = {
            ...textModel[lineIdx],
            components: []
        }

        // Update the line components
        textModel[lineIdx].components.forEach((prevComponent, idx) => {
            if (idx === componentIdx) {
                updatedComponents.forEach(updatedComponent => {
                    upadted = {
                        ...upadted,
                        components: [...upadted.components, updatedComponent]
                    }
                });

            } else {
                upadted = {
                    ...upadted,
                    components: [...upadted.components, prevComponent]
                }
            }
        });

        // Update the model
        textModelRef.current = textModel.map((prevLine, idx) => 
            idx === lineIdx ? upadted : prevLine
        );
    }

    const applyToLine = (cmd: string, line: HTMLDivElement) => {
        const textModel = textModelRef.current;

        const lineIdx = Number(line.dataset.index);
        if (Number.isNaN(lineIdx)) {
            return;
        }

        // Update the line applied commands
        let updated = updateCommands(textModel[lineIdx].applied, cmd);
        
        // Include the updated commands to line at lineIdx
        const updatedLine = {
            ...textModel[lineIdx],
            applied: updated
        }

        // Update the model
        textModelRef.current = textModel.map((line, idx) => 
            idx === lineIdx ? updatedLine : line
        );
    }

    const applyToLines = (
        cmd: string,
        startLine: HTMLDivElement,
        endLine: HTMLDivElement,
        target: string
    ) => {
        const range = savedRangeRef.current;

        let curLine: HTMLDivElement | null = startLine;
        while (curLine && curLine !== endLine) {
            if (target === 'line') {
                applyToLine(cmd, curLine);

            } else if (curLine === startLine) {
                const { startContainer, startOffset } = range;

                const startIdx = Number(startContainer.parentElement?.dataset.index);
                if (Number.isNaN(startIdx)) {
                    return;
                }

                curLine.childNodes.forEach((component, idx) => {
                    if (idx === startIdx) {
                        applyToComponent(cmd, component as HTMLSpanElement, { startOffset });

                    } else if (idx > startIdx) {
                        applyToComponent(cmd, component as HTMLSpanElement, { startOffset: Infinity });
                    }
                });

            } else {
                curLine.childNodes.forEach(component => {
                    applyToComponent(cmd, component as HTMLSpanElement, { startOffset: Infinity });
                });
            }

            curLine = curLine.nextSibling as HTMLDivElement | null;
        }

        if (curLine === endLine) {
            if (target === 'line') {
                applyToLine(cmd, curLine);

            } else {
                const { endContainer, endOffset } = range;

                const endIdx = Number(endContainer.parentElement?.dataset.index);
                if (Number.isNaN(endIdx)) {
                    return;
                }

                curLine.childNodes.forEach((component, idx) => {
                    if (idx > endIdx) return;

                    idx === endIdx
                        ? applyToComponent(cmd, component as HTMLSpanElement, { endOffset })
                        : applyToComponent(cmd, component as HTMLSpanElement, { startOffset: Infinity });
                });
            }
        }
    }

   const applyToModel = (cmd: string, target: string = 'component') => {
    const editor = document.querySelector('.editor') as HTMLDivElement | null;
    if (!editor) {
        console.error('editor element is not found');
        return;
    }

    const range = savedRangeRef.current;
    const rangeContainer = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;
    
    if (!(rangeContainer instanceof HTMLElement)) {
        return;
    }

    if (rangeContainer.tagName === 'SPAN' && target === 'component') {
        applyToComponent(cmd, rangeContainer);

    } else {
        const { startContainer, endContainer } = range;
        
        const closestLine = (node: HTMLElement): HTMLDivElement | null => {
            const element = node.nodeType === Node.ELEMENT_NODE
                ? node
                : (node.parentElement ?? null);
            
            return (element?.closest('div') ?? null);
        }

        const startLine = closestLine(startContainer as HTMLElement);
        const endLine = closestLine(endContainer as HTMLElement);

        if (startLine instanceof HTMLDivElement && endLine instanceof HTMLDivElement) {
            applyToLines(cmd, startLine, endLine, target);
        }
    }

    renderTextModel(editor);
   }

   const getFontCss = (fontName: string): string => {
        let fontCss = '';
        fonts.forEach(font => {
            if (font.name === fontName) {
                fontCss = font.css;
                return;
            }
        });

        return fontCss;
   }

    return (
        <div className="menu-container">
            <div className="menu">
                <div className="section font-section">
                    <DropDown 
                        options={fonts.map(font => font.name)}
                        defaultIndex={0}
                        onSelect={(option) => applyToModel(`FONT_${getFontCss(option)}`)}/>

                    <DropDown
                        className="font-size"
                        options={loadFontSizes(4, 64)}
                        defaultIndex={0}
                        onSelect={(option) => applyToModel(`FONTSIZE_${option}px`)}/>
                </div>

                <div className="section styles-section">
                    <div className="style" onClick={() => applyToModel('STYLE_BOLD')}>
                        <strong>B</strong>
                    </div>

                    <div className="style" onClick={() => applyToModel('STYLE_ITALIC')}>
                        <i>I</i>
                    </div>

                    <div className="style" onClick={() => applyToModel('STYLE_UNDERLINED')}>
                        <u>U</u>
                    </div>
                </div>

                <div className="section colors-section">
                    <ColorSelector 
                        id={'text-color'} 
                        label="A"
                        onSelect={(color) => { applyToModel(`COLOR_${color}`) }}/>

                    <ColorSelector 
                        id={'highlight-color'} 
                        label="H"
                        onSelect={(color) => { applyToModel(`HIGHLIGHT_${color}`) }}/>
                </div>

                <div className="section alignment-section">
                    <div onClick={() => applyToModel('ALIGN_LEFT', 'line')}>
                        <i className="fa-solid fa-align-left"></i>
                    </div>

                    <div onClick={() => applyToModel('ALIGN_CENTER', 'line')}>
                        <i className="fa-solid fa-align-center"></i>
                    </div>

                    <div onClick={() => applyToModel('ALIGN_RIGHT', 'line')}>
                        <i className="fa-solid fa-align-right"></i>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Menu;