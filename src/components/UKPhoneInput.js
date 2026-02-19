import React from 'react';

/**
 * UKPhoneInput — A UK-styled phone number input with +44 prefix and flag.
 *
 * Props:
 *   value        — the local number (without +44), e.g. "7700900000"
 *   onChange     — called with the raw local digits (no +44)
 *   required     — optional boolean
 *   className    — optional extra classes on wrapper
 *   inputClass   — optional extra classes on the <input>
 *   placeholder  — optional placeholder, defaults to "7700 900 000"
 *   id           — optional id for the input
 */
const UKPhoneInput = ({
    value = '',
    onChange,
    required = false,
    className = '',
    inputClass = '',
    placeholder = '7700 900 000',
    id
}) => {

    const handleChange = (e) => {
        // Strip everything except digits
        const digits = e.target.value.replace(/\D/g, '');
        if (onChange) onChange(digits);
    };

    return (
        <div className={`flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition ${className}`}>
            {/* UK Flag + Prefix */}
            <div className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-300 select-none shrink-0">
                {/* Inline UK Flag SVG */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 60 30"
                    className="w-5 h-3 rounded-sm overflow-hidden shrink-0"
                >
                    <clipPath id="ukflag-clip">
                        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                    </clipPath>
                    <path d="M0,0 v30 h60 v-30 z" fill="#00247d" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                    <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#ukflag-clip)" stroke="#cf142b" strokeWidth="4" />
                    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                    <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6" />
                </svg>
                <span className="text-sm font-semibold text-gray-600">+44</span>
            </div>

            {/* Number Input */}
            <input
                id={id}
                type="tel"
                value={value}
                onChange={handleChange}
                required={required}
                maxLength={11}
                placeholder={placeholder}
                className={`flex-1 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white outline-none ${inputClass}`}
            />
        </div>
    );
};

export default UKPhoneInput;
