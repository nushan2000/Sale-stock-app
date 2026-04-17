import React from 'react';

/**
 * Reusable modal dialog.
 *
 * Props:
 *   open: bool
 *   onClose: fn
 *   title: string
 *   children: JSX
 *   size: 'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *   footer: JSX  (optional)
 */
const FormDialog = ({ open, onClose, title, children, size = 'md', footer }) => {
    if (!open) return null;

    return (
        <div className="dialog-backdrop" onClick={onClose}>
            <div
                className={`dialog-box dialog-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="dialog-header">
                    <h3 className="dialog-title">{title}</h3>
                    <button className="dialog-close" onClick={onClose}>✕</button>
                </div>
                <div className="dialog-body">{children}</div>
                {footer && <div className="dialog-footer">{footer}</div>}
            </div>
        </div>
    );
};

export default FormDialog;
