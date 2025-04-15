import React, { useEffect, useState, useRef } from "react";

interface Props {
    className?: string
    options: string[]
    defaultIndex: number
    onSelect?: (option: string) => void
}

const DropDown: React.FC<Props> = ({ className, options, defaultIndex, onSelect }) => {
    const optionsListRef = useRef<HTMLDivElement>(null);
    const dropDownRef = useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<string>(options[defaultIndex]);

    const selectOption = (option: string) => {
        setSelected(option);
        setIsOpen(false);

        if (onSelect) onSelect(option);
    }

    const isOutside = (
        event: MouseEvent,
        element: HTMLDivElement
    ) => {
        const rect = element.getBoundingClientRect();
        const { clientX, clientY } = event;

        const xAxis = clientX < rect.left || clientX > rect.right;
        const yAxis = clientY < rect.top || clientY > rect.bottom;

        return xAxis || yAxis;
    }

    useEffect(() => {
        const optionsList = optionsListRef.current;
        const dropDown = dropDownRef.current;
        if (!optionsList || !dropDown) return;

        const onMouseDown = (event: MouseEvent) => {
            if (isOutside(event, optionsList) && isOutside(event, dropDown)) {
                setIsOpen(false);
            }
        } 

        document.addEventListener('mousedown', onMouseDown);

        return () => {
            document.removeEventListener('mousedown', onMouseDown);
        }

    })

    return (
        <div className={className ? `drop-down ${className}` : 'drop-down'} ref={dropDownRef}>
            <span className="selected">{ selected }</span>

            {isOpen
                ? (<i className="material-icons" onClick={() => setIsOpen(!isOpen)}>arrow_drop_up</i>)
                : (<i className="material-icons" onClick={() => setIsOpen(!isOpen)}>arrow_drop_down</i>)
            }

            {isOpen && options.length > 0
                ? (
                    <div className="options" ref={optionsListRef}>
                        {options.map(option => (
                            <div 
                                className="option" 
                                key={option} 
                                onClick={() => selectOption(option)}>
                                { option }
                            </div>
                        ))}
                    </div>
                ) : null
            }

        </div>
    );
}

export default DropDown;