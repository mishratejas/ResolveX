import axios from 'axios';

class PriorityService {
    constructor() {
        this.apiKey = process.env.GOOGLE_API_KEY;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        // Validate API key on initialization
        if (!this.apiKey || this.apiKey === 'is set') {
            console.warn('⚠️ GOOGLE_API_KEY not properly configured. AI priority assignment will use fallback method.');
        }
    }

    async analyzePriority(complaintData) {
        // 🔧 FIX: Validate API key before making request
        if (!this.apiKey || this.apiKey === 'is set' || this.apiKey.length < 10) {
            console.warn('🔄 No valid API key, using rule-based fallback');
            return this.ruleBasedFallback(complaintData);
        }

        try {
            const { title, description, category, department } = complaintData;
            
            // 🔧 FIX: Validate input data
            if (!title || !description) {
                console.warn('⚠️ Missing title or description, using rule-based fallback');
                return this.ruleBasedFallback(complaintData);
            }
            
            const prompt = `
            Analyze this complaint and assign a priority level (low, medium, high, or critical) based on:

            1. URGENCY: Does it involve safety, health, emergency, or time-sensitive issues?
            2. IMPACT: How many people/areas does it affect?
            3. SEVERITY: Is it critical infrastructure, basic amenities, or minor inconvenience?

            Complaint Details:
            - Title: ${title}
            - Description: ${description}
            - Category: ${category || 'Not specified'}
            - Department: ${department || 'Not specified'}

            Priority Rules:
            - CRITICAL: Safety hazards, health emergencies, critical infrastructure failure, widespread impact, life-threatening situations, gas leaks, fires, floods, building collapse
            - HIGH: Service disruptions, major issues, moderate impact, non-critical but important issues, power outages, water supply issues, sewage problems
            - MEDIUM: Standard complaints, routine issues, limited impact, broken streetlights, potholes, general maintenance
            - LOW: Minor issues, cosmetic problems, general inquiries, low impact, suggestions

            Return ONLY one word: low, medium, high, or critical (in lowercase, no punctuation or explanation).
            `;

            // 🔧 FIX: Add timeout to API call
            const response = await axios.post(
                `${this.apiUrl}?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                },
                {
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // 🔧 FIX: Better response validation
            if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
                console.warn('⚠️ Invalid AI response structure, using fallback');
                return this.ruleBasedFallback(complaintData);
            }

            const aiText = response.data.candidates[0]?.content?.parts[0]?.text;
            if (!aiText) {
                console.warn('⚠️ No text in AI response, using fallback');
                return this.ruleBasedFallback(complaintData);
            }

            // Extract priority from response (handle various formats)
            const priority = aiText.trim().toLowerCase().replace(/[^a-z]/g, '');
            
            // Validate response
            if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
                console.warn(`⚠️ Invalid priority from AI: "${aiText}", using fallback`);
                return this.ruleBasedFallback(complaintData);
            }

            console.log(`✅ AI successfully assigned priority: ${priority}`);
            return priority;

        } catch (error) {
            // 🔧 FIX: Better error logging
            if (error.code === 'ECONNABORTED') {
                console.error('⏰ AI request timeout, using fallback');
            } else if (error.response) {
                console.error('❌ AI API Error:', error.response.status, error.response.data?.error?.message || 'Unknown error');
            } else if (error.request) {
                console.error('❌ No response from AI API, using fallback');
            } else {
                console.error('❌ Error setting up AI request:', error.message);
            }
            
            // Always fallback on error
            return this.ruleBasedFallback(complaintData);
        }
    }

    ruleBasedFallback(complaintData) {
        const { title, description, category } = complaintData;
        const text = `${title || ''} ${description || ''}`.toLowerCase();

        console.log(`🔄 Using rule-based priority assignment for: "${title}"`);

        // Critical priority keywords (life-threatening, emergency)
        const criticalKeywords = [
            'emergency', 'urgent', 'critical', 'accident', 'fire', 'flood',
            'leak', 'collapse', 'injury', 'danger', 'hazard', 'life threatening',
            'explosion', 'gas leak', 'chemical', 'electrocution', 'building collapse',
            'medical emergency', 'death', 'dying', 'trapped', 'help', 'sos',
            'crisis', 'catastrophe', 'disaster', 'fatal', 'serious injury'
        ];

        // High priority keywords (major service disruption)
        const highKeywords = [
            'broken', 'stuck', 'power cut', 'water outage', 'no electricity',
            'no water', 'sewage', 'blocked drain', 'major', 'severe', 'damage',
            'theft', 'robbery', 'fight', 'crime', 'violence', 'overflow',
            'burst pipe', 'flooding', 'road accident', 'large pothole', 'sinkhole',
            'fallen tree', 'blocked road', 'traffic jam', 'unsafe', 'dangerous'
        ];

        // Medium priority keywords (standard issues)
        const mediumKeywords = [
            'issue', 'problem', 'not working', 'repair', 'fix', 'maintenance',
            'slow', 'delay', 'quality', 'service', 'complaint',
            'broken light', 'cracked', 'damaged', 'needs attention',
            'streetlight out', 'pothole', 'graffiti', 'litter', 'noise'
        ];

        // Check for critical priority
        if (criticalKeywords.some(keyword => text.includes(keyword))) {
            console.log('✅ Assigned priority: CRITICAL (keyword match)');
            return 'critical';
        }

        // Check for high priority
        if (highKeywords.some(keyword => text.includes(keyword))) {
            console.log('✅ Assigned priority: HIGH (keyword match)');
            return 'high';
        }

        // Check for medium priority
        if (mediumKeywords.some(keyword => text.includes(keyword))) {
            console.log('✅ Assigned priority: MEDIUM (keyword match)');
            return 'medium';
        }

        // Category-based priority if no keywords match
        const categoryPriorityMap = {
            'water': 'high',           // Water supply issues are serious
            'electricity': 'high',     // Power issues affect many
            'security': 'high',        // Safety concerns are important
            'road': 'medium',          // Road issues vary
            'sanitation': 'medium',    // Waste management important but not critical
            'transport': 'medium',     // Transport issues affect daily life
            'other': 'low'            // Unknown categories default low
        };

        const categoryPriority = categoryPriorityMap[category] || 'low';
        console.log(`✅ Assigned priority: ${categoryPriority.toUpperCase()} (category-based: ${category})`);
        return categoryPriority;
    }
}

export default new PriorityService();