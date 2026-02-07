import { useState, useRef } from 'react';

// Lightweight wrapper around the browser SpeechRecognition API
// to capture emergency request details via voice in a single free-form utterance.
// Supports English and Tamil via the `language` option.
export const useVoiceRequest = (onParsedResult, options = {}) => {
    const { language = 'en-IN' } = options;
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const langRef = useRef(language);
    const transcriptRef = useRef('');

    const getRecognition = (lang) => {
        if (recognitionRef.current) return recognitionRef.current;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition API not available in this browser.');
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = false; // one phrase; browser ends when user pauses

        recognition.onresult = (event) => {
            let finalText = '';
            for (let i = 0; i < event.results.length; i++) {
                finalText += event.results[i][0].transcript + ' ';
            }
            finalText = finalText.trim();
            transcriptRef.current = finalText;
            setTranscript(finalText);
        };

        recognition.onend = () => {
            setIsListening(false);
            const finalText = (transcriptRef.current || '').trim();
            if (finalText && typeof onParsedResult === 'function') {
                const parsed = parseTranscript(finalText);
                onParsedResult(parsed, finalText);
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        return recognition;
    };

    const startListening = () => {
        // If the language has changed since last time, reset the recognizer
        if (langRef.current !== language) {
            recognitionRef.current = null;
            langRef.current = language;
        }

        const recognition = getRecognition(language);
        if (!recognition) return;
        transcriptRef.current = '';
        setTranscript('');
        setIsListening(true);
        recognition.start();
    };

    const stopListening = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;
        recognition.stop();
    };

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
    };
};

// Parser: tries to extract patient name, condition type, urgency, blood group,
// resource type, and quantity from a free-form emergency description.
// Supports common English + Tamil medical phrases.
const parseTranscript = (text) => {
    if (!text) return {};
    const lower = text.toLowerCase();

    // Helper: Word to number map
    const wordToNum = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    // 1. Blood Group Parsing (Enhanced)
    let bloodGroup = '';
    const bgMap = {
        'o positive': 'O+', 'o negative': 'O-', 'o plus': 'O+', 'o minus': 'O-',
        'a positive': 'A+', 'a negative': 'A-', 'a plus': 'A+', 'a minus': 'A-',
        'b positive': 'B+', 'b negative': 'B-', 'b plus': 'B+', 'b minus': 'B-',
        'ab positive': 'AB+', 'ab negative': 'AB-', 'ab plus': 'AB+', 'ab minus': 'AB-'
    };

    for (const [phrase, code] of Object.entries(bgMap)) {
        if (lower.includes(phrase)) {
            bloodGroup = code;
            break;
        }
    }
    if (!bloodGroup) {
        const simpleGroups = ['ab+', 'ab-', 'a+', 'a-', 'b+', 'b-', 'o+', 'o-'];
        for (const bg of simpleGroups) {
            if (lower.includes(bg.toLowerCase()) ||
                lower === bg.toLowerCase() ||
                lower.includes(bg.replace('+', ' +')) ||
                lower.includes(bg.replace('-', ' -'))) {
                bloodGroup = bg.toUpperCase();
                break;
            }
        }
    }

    // 2. Urgency Parsing
    let urgency = '';
    if (
        lower.includes('critical') ||
        lower.includes('life threatening') ||
        lower.includes('icu') ||
        lower.includes('immediately') ||
        lower.includes('emergency') ||
        lower.includes('மிகவும் அவசரம்') ||
        lower.includes('கிரிட்டிக்கல்')
    ) {
        urgency = 'Critical';
    } else if (
        lower.includes('high') ||
        lower.includes('urgent') ||
        lower.includes('urgently') ||
        lower.includes('asap') ||
        lower.includes('fast') ||
        lower.includes('அவசரம்')
    ) {
        urgency = 'High';
    } else if (
        lower.includes('medium') ||
        lower.includes('moderate') ||
        lower.includes('சராசரி')
    ) {
        urgency = 'Medium';
    } else if (
        lower.includes('low') ||
        lower.includes('minor') ||
        lower.includes('குறைவு')
    ) {
        urgency = 'Low';
    }

    // 3. Condition Type Parsing
    let conditionType = '';
    if (
        lower.includes('trauma') ||
        lower.includes('accident') ||
        lower.includes('crash') ||
        lower.includes('road traffic') ||
        lower.includes('collision') ||
        lower.includes('விபத்து')
    ) {
        conditionType = 'Trauma / Accident';
    } else if (
        lower.includes('surgery') ||
        lower.includes('operation') ||
        lower.includes('procedure') ||
        lower.includes('bypass') ||
        lower.includes('அறுவை') ||
        lower.includes('ஆப்பரேஷன்')
    ) {
        conditionType = 'Surgery';
    } else if (
        lower.includes('transplant') ||
        lower.includes('organ match') ||
        lower.includes('உறுப்பு மாற்று')
    ) {
        conditionType = 'Organ Transplant';
    } else if (
        lower.includes('bleeding') ||
        lower.includes('haemorrhage') ||
        lower.includes('hemorrhage') ||
        (lower.includes('blood') && lower.includes('loss')) ||
        (lower.includes('இரத்தம்') && lower.includes('வெளி'))
    ) {
        conditionType = 'Internal Bleeding';
    } else if (
        lower.includes('critical care') ||
        lower.includes('ventilator') ||
        lower.includes('life support')
    ) {
        conditionType = 'ICU / Critical Care';
    }

    // 4. Resource Type & Specific Organ
    let resourceType = 'blood';
    let organType = '';

    const organKeywords = ['organ', 'kidney', 'liver', 'heart', 'lung', 'lungs', 'eyes', 'cornea', 'pancreas', 'உறுப்பு', 'கிட்னி', 'லிவர்', 'இதயம்', 'நுரையீரல்'];
    if (organKeywords.some(w => lower.includes(w))) {
        resourceType = 'organ';
    }

    if (
        lower.includes('kidney') ||
        lower.includes('renal') ||
        lower.includes('கிட்னி')
    ) {
        organType = 'Kidney';
    } else if (
        lower.includes('liver') ||
        lower.includes('hepatic') ||
        lower.includes('லிவர்')
    ) {
        organType = 'Liver';
    } else if (
        lower.includes('heart') ||
        lower.includes('cardiac') ||
        lower.includes('இதயம்')
    ) {
        organType = 'Heart';
    } else if (
        lower.includes('lung') ||
        lower.includes('pulmonary') ||
        lower.includes('நுரையீரல்')
    ) {
        organType = 'Lungs';
    }

    // 5. Quantity Parsing
    let quantity = 1;
    const qtyRegex = /(?:(\d+)|([a-z]+))\s+(?:unit|units|bag|bags|bottle|bottles|packet|packets)/i;
    const qtyMatch = lower.match(qtyRegex);

    if (qtyMatch) {
        if (qtyMatch[1]) {
            quantity = parseInt(qtyMatch[1], 10);
        } else if (qtyMatch[2] && wordToNum[qtyMatch[2]]) {
            quantity = wordToNum[qtyMatch[2]];
        }
    }

    // 6. Patient Name Parsing
    let patientName = '';
    const nameStopWords = ['is', 'needs', 'requires', 'has', 'suffering', 'demands', 'wants', 'urgently', 'immediately', 'due', 'for', 'with', 'in'];

    const explicitNameMatch = text.match(/(?:patient\s+name|patient)\s+(?:is\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (explicitNameMatch && explicitNameMatch[1]) {
        const potentialName = explicitNameMatch[1].trim();
        const parts = potentialName.split(/\s+/);
        if (parts.length > 1 && nameStopWords.includes(parts[1].toLowerCase())) {
            patientName = parts[0];
        } else {
            patientName = potentialName;
        }
    }

    if (!patientName) {
        const myNameMatch = text.match(/my\s+name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
        if (myNameMatch && myNameMatch[1]) {
            patientName = myNameMatch[1].trim();
        }
    }

    if (patientName) {
        const nameParts = patientName.split(/\s+/);
        if (nameParts.length > 1 && nameStopWords.includes(nameParts[nameParts.length - 1].toLowerCase())) {
            patientName = nameParts.slice(0, -1).join(' ');
        }
    }

    return {
        patientName,
        urgency,
        conditionType,
        bloodGroup,
        resourceType,
        quantity,
        organType,
    };
};
