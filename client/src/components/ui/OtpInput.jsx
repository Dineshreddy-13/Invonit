import React, { useRef, useState, useEffect } from "react";
import { cn } from "../../lib/utils";

/**
 * Modern 6-digit OTP Input component.
 */
const OtpInput = ({ length = 6, value = "", onChange, className }) => {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  // Sync internal state with external value
  useEffect(() => {
    if (value.length === length) {
      setOtp(value.split(""));
    }
  }, [value, length]);

  const handleChange = (element, index) => {
    const val = element.value;
    if (isNaN(val)) return;

    let newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);
    
    const finalOtp = newOtp.join("");
    onChange?.(finalOtp);

    // Focus next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(data)) return;

    const newOtp = data.split("").concat(new Array(length - data.length).fill(""));
    setOtp(newOtp.slice(0, length));
    onChange?.(data);

    // Focus last character input or next empty
    const lastIndex = Math.min(data.length, length - 1);
    inputRefs.current[lastIndex].focus();
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          ref={(el) => (inputRefs.current[index] = el)}
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900"
        />
      ))}
    </div>
  );
};

export { OtpInput };
