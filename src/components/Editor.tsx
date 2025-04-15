import React, { useEffect, useRef } from "react";

// Interfaces
import { Line } from "../interfaces";

// Context
import useTextModelCtx from "../context/TextModelCtx";

const Editor: React.FC = () => {
    const { textModelRef, savedRangeRef, renderTextModel } = useTextModelCtx();
    const editorRef = useRef<HTMLDivElement>(null);

    // Return the selected object and its container
    const getSelectedRange = () => {
        let range, rangeContainer;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);

            rangeContainer = range.commonAncestorContainer.nodeType === 3
                ? range.commonAncestorContainer.parentElement
                : range.commonAncestorContainer;
        }

        return {range, rangeContainer};
    }

    // Updates the selected range into the component corresponding to componentIndex
    // within the line corresponding to lineIndex
    const updateCursor = (
        editor: HTMLDivElement,
        lineIndex: number, 
        componentIndex: number,
        offset: number
    ) => {
        editor.childNodes.forEach(line => {
            const lineElement = line as HTMLDivElement;

            if (lineElement.dataset.index === String(lineIndex)) {
                const updatedCusor = new Range();
                updatedCusor.collapse(true);
    
                lineElement.childNodes.forEach(component => {
                    const componentElement = component as HTMLSpanElement;

                    if (componentElement.dataset.index === String(componentIndex)) {
                        const textNode = componentElement.firstChild;

                        if (!textNode || textNode.nodeType !== 3) {
                            updatedCusor.setStart(componentElement, 0);
                        } else {        
                            const content = textNode.textContent || '';
                            if (offset <= content.length) updatedCusor.setStart(textNode, offset);
                        }
                    }
                });    
    
                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(updatedCusor);
                }
            }
        });
    }

    // Build a text model from the editor content
    const extractModel = (editor: HTMLDivElement) => {
        const textModel = textModelRef.current;

        let extractedModel: Array<Line> = [];
        editor.childNodes.forEach(line => {
            const lineElement = line as HTMLElement;

            if (lineElement.tagName === 'DIV') {
                const lineIdx = Number(lineElement.dataset.index);
                const prevLine = textModel[lineIdx];

                let lineObj: Line = {
                    components: [],
                    applied: prevLine ? prevLine.applied : []
                }

                lineElement.childNodes.forEach(component => {
                    const componentElement = component as HTMLSpanElement;
                    
                    if (componentElement.textContent) {
                        const componentIdx = Number(componentElement.dataset?.index);
                        const prevComponent = textModel[lineIdx]?.components[componentIdx];

                        lineObj.components.push({
                            content: componentElement.textContent,
                            applied: prevComponent ? prevComponent.applied : []
                        });
                    }
                });

                if (!lineObj.components.length) {
                    lineObj.components.push({ content: '', applied: [] })
                }

                extractedModel.push(lineObj);

            } else if (lineElement.textContent) {
                extractedModel.push({
                    components: [{ content: lineElement.textContent, applied: [] }],
                    applied: []
                });
            }
        });

        return extractedModel;
    }

    // Syuncs the editor input with the text model
    const handleEditorInput = (editor: HTMLDivElement) => {
        const { range, rangeContainer } = getSelectedRange();
        if (!range || !(rangeContainer instanceof HTMLElement)) {
            return;
        }

        const extractedModel = extractModel(editor);
        const textModel = textModelRef.current;
        
        let lineIdx, componentIdx: number;
        const offset = range.endOffset;

        // Get the corresponding indices from the selected range
        if (rangeContainer.tagName === 'DIV') {
            lineIdx = Number(rangeContainer.dataset.index) || 0;
            componentIdx = 0;

        } else {
            lineIdx = Number(rangeContainer.parentElement?.dataset.index) || 0;
            componentIdx = Number(rangeContainer.dataset.index) || 0;
        }

        // increment the line index if a new line got added
        if (textModel.length > 0 && extractedModel.length > textModel.length) {
            lineIdx += 1;
        }

        // Update and rerender the model
        textModelRef.current = extractedModel;
        renderTextModel(editor);

        // Reset the cursor
        extractedModel.length < textModel.length
            ? window.getSelection()?.removeAllRanges()
            : updateCursor(editor, lineIdx, componentIdx, offset);
    }

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            console.error("Editor element is not found");
            return;
        }

        const updateSavedRange = () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                savedRangeRef.current = range;
            }
        }

        const handleInput = () => {
            handleEditorInput(editor);
        }

        editor.addEventListener('input', handleInput);
        editor.addEventListener('keyup', updateSavedRange);
        editor.addEventListener('mouseup', updateSavedRange);

        return () => {
            editor.removeEventListener('input', handleInput);
            editor.removeEventListener('keyup', updateSavedRange);
            editor.removeEventListener('mouseup', updateSavedRange);
        }
    }, [])

    return (
        <div className="editor-container">
            <div 
                className="editor" 
                contentEditable
                ref={editorRef}>
            </div>
        </div>
    );
}

export default Editor;