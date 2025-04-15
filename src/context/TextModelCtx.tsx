import React, { useRef, createContext, useContext } from "react";

// Interfaces
import { Line } from "../interfaces";

// Define the context types
interface ContextType {
    textModelRef: React.RefObject<Array<Line>>
    savedRangeRef: React.RefObject<Range>
    renderTextModel: (editor: HTMLDivElement) => void
}

interface Props {
    children: React.ReactNode | React.ReactNode[];
}

// create the context
const TextModelCtx = createContext<ContextType | null>(null);
const useTextModelCtx = () => {
    const context = useContext(TextModelCtx);
    if (!context) {
        throw new Error('textModelContext is not used within its provider!');
    }

    return context;
}

// Define and export the context provider component
export const TextModelProvider: React.FC<Props> = ({ children }) => {
    const textModelRef = useRef<Array<Line>>([]);
    const savedRangeRef = useRef<Range>(new Range()); // Contains the last saved range within editor

    // Render the text model into the editor
    const renderTextModel = (editor: HTMLDivElement) => {
        const textModel = textModelRef.current;

        editor.innerHTML = '';
        textModel.forEach((line, lineIdx) => {
            const lineElement = document.createElement('div');

            line.applied.forEach(cmd => {
                const [cmdType, cmdVal] = cmd.split('_');

                if (cmdType === 'ALIGN') {
                    lineElement.classList.add(cmdVal);
                }
            });

            line.components.forEach((component, componentIdx) => {
                const wrapper = document.createElement('span');
                wrapper.textContent = component.content;

                component.applied.forEach(cmd => {
                    const [cmdType, cmdVal] = cmd.split('_');

                    if (cmdType === 'STYLE') {
                        wrapper.classList.add(cmdVal);
                    } else if (cmdType === 'FONT' || cmdType === 'FONTSIZE') {
                        cmdType === 'FONT'
                            ? wrapper.style.fontFamily = cmdVal
                            : wrapper.style.fontSize = cmdVal; 
                    } else if (cmdType === 'COLOR' || cmdType === 'HIGHLIGHT') {
                        cmdType === 'COLOR'
                            ? wrapper.style.color = cmdVal
                            : wrapper.style.backgroundColor = cmdVal;
                    }
                });

                wrapper.dataset.index = String(componentIdx);
                lineElement.appendChild(wrapper);
            });

            lineElement.dataset.index = String(lineIdx);
            editor.appendChild(lineElement);
        });
    }

    return (
        <TextModelCtx.Provider value={{ textModelRef, savedRangeRef, renderTextModel }}>
            { children }
        </TextModelCtx.Provider>
    );
}

export default useTextModelCtx;