// Global variables
let currentRecordData = null;
let roiChart = null;
let isSDKInitialized = false;
let pageLoadData = null;

// Initialize the widget when DOM is ready
function initializeWidget() {
    if (!isSDKInitialized) {
        try {
            // Initialize SDK without triggering multiple times
            ZOHO.embeddedApp.on("PageLoad", function(data) {
                console.log("PageLoad event received:", data);
                pageLoadData = data;
                
                // Auto-fetch data when page loads
                setTimeout(() => {
                    if (document.getElementById("fetchDataBtn")) {
                        autoFetchCampaignData();
                    }
                }, 1000);
            });
            
            ZOHO.embeddedApp.init();
            isSDKInitialized = true;
        } catch (error) {
            console.error("SDK initialization error:", error);
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const fetchDataBtn = document.getElementById("fetchDataBtn");
    const generateAIBtn = document.getElementById("generateAIBtn");
    const statusMessage = document.getElementById("statusMessage");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const debugConsole = document.getElementById("debugConsole"); // This might be null after debug section removal

    // Event listeners
    fetchDataBtn.addEventListener("click", fetchCampaignData);
    generateAIBtn.addEventListener("click", generateAIInsights);

    // Debug function
    function debugLog(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        if (debugConsole) {
            debugConsole.innerHTML += logEntry + "\n";
            if (data) {
                debugConsole.innerHTML += JSON.stringify(data, null, 2) + "\n";
            }
            debugConsole.scrollTop = debugConsole.scrollHeight;
        }
        console.log(logEntry, data);
    }

    // Fetch campaign data from CRM
    function fetchCampaignData() {
        debugLog("Starting data fetch...");
        statusMessage.textContent = "Fetching campaign data...";
        statusMessage.className = "status-message info";

        // Get current record ID using the correct API
        ZOHO.embeddedApp.on("PageLoad", function(data) {
            debugLog("Page load data received:", data);
            
            if (data && data.EntityId) {
                const recordId = data.EntityId;
                debugLog("Record ID from PageLoad:", recordId);
                fetchRecordData(recordId);
            } else {
                // Fallback: Try to get current entity info
                ZOHO.CRM.CONFIG.getCurrentUser().then(function(response) {
                    debugLog("Current user response:", response);
                    // If we can't get record ID from PageLoad, try alternative method
                    tryAlternativeRecordFetch();
                }).catch(function(error) {
                    debugLog("Error with getCurrentUser:", error);
                    tryAlternativeRecordFetch();
                });
            }
        });
        
        // Trigger page load if not already triggered
        if (!window.pageLoadTriggered) {
            window.pageLoadTriggered = true;
            ZOHO.embeddedApp.init();
        }
    }
    
    // Alternative method to get record data
    function tryAlternativeRecordFetch() {
        debugLog("Trying alternative record fetch methods...");
        
        // Method 1: Try to get entity info
        ZOHO.CRM.META.getModules().then(function(response) {
            debugLog("Modules response:", response);
            
            // Method 2: Check if we're in a record context
            const urlParams = new URLSearchParams(window.location.search);
            const recordId = urlParams.get('id') || urlParams.get('recordId');
            
            if (recordId) {
                debugLog("Record ID found in URL:", recordId);
                fetchRecordData(recordId);
            } else {
                // Method 3: Manual record ID input (for testing)
                debugLog("No record ID found, showing manual input option");
                showManualRecordInput();
            }
        }).catch(function(error) {
            debugLog("Error with getModules:", error);
            showManualRecordInput();
        });
    }
    
    // Show manual record ID input for testing
    function showManualRecordInput() {
        const manualInput = prompt("Enter Record ID for testing (or leave empty to use demo data):");
        
        if (manualInput && manualInput.trim()) {
            fetchRecordData(manualInput.trim());
        } else {
            // Use demo data for testing
            debugLog("Using demo data for testing");
            useDemoData();
        }
    }
    
    // Demo data for testing purposes
    function useDemoData() {
        debugLog("Loading demo data...");
        
        const demoData = {
            id: "demo123",
            tocheckthewidgetforcampaign__Company_Name: "Bright Interiors Pvt Ltd",
            tocheckthewidgetforcampaign__Revenue_Last_Quarter: 850000,
            tocheckthewidgetforcampaign__Profit: 220000,
            tocheckthewidgetforcampaign__Loss: 30000,
            tocheckthewidgetforcampaign__Net_Profit_Loss: 190000,
            tocheckthewidgetforcampaign__Previous_Campaign_Type: "Social Media",
            tocheckthewidgetforcampaign__Previous_Campaign_ROI: 12,
            tocheckthewidgetforcampaign__Target_Audience: "Professionals",
            tocheckthewidgetforcampaign__Sales_Report_Summary: "Sales improved in Tier-2 cities; decline in metros due to ad fatigue. Customer engagement increased by 25% through targeted content marketing.",
            tocheckthewidgetforcampaign__General_Business_Categories: "Medium Enterprise",
            tocheckthewidgetforcampaign__Industry_Oriented_Categories: "Retail",
            tocheckthewidgetforcampaign__Market_Orientation: "B2C (Business to Consumer)"
        };
        
        currentRecordData = demoData;
        updateUI(demoData);
        generateAIBtn.disabled = false;
        statusMessage.textContent = "Demo data loaded successfully!";
        statusMessage.className = "status-message success";
    }

    // Fetch record data using the record ID
    function fetchRecordData(recordId) {
        debugLog("Fetching record data for ID:", recordId);
        
        ZOHO.CRM.API.getRecord({
            Entity: "tocheckthewidgetforcampaign__Campaign_Intelligences",
            RecordID: recordId
        })
        .then(function(response) {
            debugLog("Record data fetched successfully:", response);
            currentRecordData = response.data[0];
            updateUI(currentRecordData);
            generateAIBtn.disabled = false;
            statusMessage.textContent = "Data fetched successfully!";
            statusMessage.className = "status-message success";
        })
        .catch(function(error) {
            debugLog("Error fetching record data:", error);
            statusMessage.textContent = "Error fetching data from CRM";
            statusMessage.className = "status-message error";
        });
    }

    // Update UI with fetched data - enhanced with debugging
    function updateUI(data) {
        debugLog("Updating UI with data:", data);
        
        const dataSection = document.getElementById("dataSection");
        
        // Debug individual field values before formatting
        debugLog("Raw field values:", {
            companyName: data.tocheckthewidgetforcampaign__Company_Name,
            revenue: data.tocheckthewidgetforcampaign__Revenue_Last_Quarter,
            profit: data.tocheckthewidgetforcampaign__Profit,
            loss: data.tocheckthewidgetforcampaign__Loss,
            netProfitLoss: data.tocheckthewidgetforcampaign__Net_Profit_Loss,
            previousCampaignType: data.tocheckthewidgetforcampaign__Previous_Campaign_Type,
            previousCampaignROI: data.tocheckthewidgetforcampaign__Previous_Campaign_ROI,
            targetAudience: data.tocheckthewidgetforcampaign__Target_Audience,
            salesReportSummary: data.tocheckthewidgetforcampaign__Sales_Report_Summary,
            generalBusinessCategory: data.tocheckthewidgetforcampaign__General_Business_Categories,
            industryCategory: data.tocheckthewidgetforcampaign__Industry_Oriented_Categories,
            marketOrientation: data.tocheckthewidgetforcampaign__Market_Orientation
        });
        
        // Update each field
        updateField("companyName", data.tocheckthewidgetforcampaign__Company_Name);
        updateField("revenue", formatCurrency(data.tocheckthewidgetforcampaign__Revenue_Last_Quarter));
        updateField("profit", formatCurrency(data.tocheckthewidgetforcampaign__Profit));
        updateField("loss", formatCurrency(data.tocheckthewidgetforcampaign__Loss));
        updateField("netProfitLoss", formatCurrency(data.tocheckthewidgetforcampaign__Net_Profit_Loss));
        updateField("previousCampaignType", data.tocheckthewidgetforcampaign__Previous_Campaign_Type);
        updateField("previousCampaignROI", formatPercentage(data.tocheckthewidgetforcampaign__Previous_Campaign_ROI));
        updateField("targetAudience", data.tocheckthewidgetforcampaign__Target_Audience);
        updateField("salesReportSummary", data.tocheckthewidgetforcampaign__Sales_Report_Summary);
        updateField("generalBusinessCategory", data.tocheckthewidgetforcampaign__General_Business_Categories);
        updateField("industryCategory", data.tocheckthewidgetforcampaign__Industry_Oriented_Categories);
        updateField("marketOrientation", data.tocheckthewidgetforcampaign__Market_Orientation);

        dataSection.style.display = "block";
        debugLog("UI update completed");
    }

    // Helper function to update individual fields with enhanced debugging
    function updateField(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            const displayValue = value || "-";
            element.textContent = displayValue;
            debugLog(`Updated field ${elementId} with value: ${displayValue} (original: ${value})`);
        } else {
            debugLog(`Element not found: ${elementId}`);
        }
    }

    // Format currency values with better handling of zero and null values
    function formatCurrency(value) {
        // Check for null, undefined, or empty string
        if (value === null || value === undefined || value === '') return "-";
        
        // Convert to number if it's a string
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        // Check if it's a valid number (including 0)
        if (isNaN(numValue)) return "-";
        
        // Format the number, including zero values
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(numValue);
    }

    // Format percentage values
    function formatPercentage(value) {
        if (!value) return "-";
        return value + "%";
    }

    // Generate AI insights with improved error handling
    function generateAIInsights() {
        if (!currentRecordData) {
            statusMessage.textContent = "Please fetch data first";
            statusMessage.className = "status-message error";
            return;
        }

        debugLog("Starting AI insights generation...");
        statusMessage.textContent = "Generating AI insights...";
        statusMessage.className = "status-message info";
        loadingIndicator.style.display = "flex";

        // Get Gemini API key from CRM variables
        ZOHO.CRM.API.getOrgVariable("tocheckthewidgetforcampaign__gemini_api_key")
            .then(function(response) {
                debugLog("API key response:", response);
                
                if (!response || !response.Success || !response.Success.Content) {
                    throw new Error("API key not found in organization variables. Please configure the Gemini API key.");
                }
                
                const apiKey = response.Success.Content;
                if (!apiKey || apiKey.trim().length === 0) {
                    throw new Error("Empty API key found. Please set a valid Gemini API key.");
                }
                
                debugLog("API key retrieved successfully");
                return callGeminiAPI(apiKey);
            })
            .catch(function(error) {
                debugLog("Error getting API key:", error);
                
                let errorMessage = "Error: Cannot retrieve API key";
                if (error.message.includes("API key not found")) {
                    errorMessage = "Configuration Error: " + error.message;
                } else if (error.message.includes("Empty API key")) {
                    errorMessage = "Configuration Error: " + error.message;
                } else if (error.message.includes("INVALID_DATA") || error.message.includes("NO_PERMISSION")) {
                    errorMessage = "Permission Error: Cannot access organization variables. Please check user permissions.";
                }
                
                statusMessage.textContent = errorMessage;
                statusMessage.className = "status-message error";
                loadingIndicator.style.display = "none";
            });
    }

    // Call Gemini API with improved error handling
    function callGeminiAPI(apiKey) {
        const prompt = constructPrompt(currentRecordData);
        debugLog("Constructed prompt:", prompt);

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        debugLog("Calling Gemini API...");
        
        fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            debugLog("Gemini API response status:", response.status);
            debugLog("Gemini API response headers:", Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                return response.text().then(errorText => {
                    debugLog("Error response body:", errorText);
                    let errorMessage = `HTTP error! status: ${response.status}`;
                    
                    // Provide more specific error messages based on status
                    if (response.status === 401) {
                        errorMessage = "Invalid API key. Please check your Gemini API key configuration.";
                    } else if (response.status === 403) {
                        errorMessage = "API access forbidden. Please check your API key permissions.";
                    } else if (response.status === 429) {
                        errorMessage = "Rate limit exceeded. Please try again in a few moments.";
                    } else if (response.status === 500) {
                        errorMessage = "AI service temporarily unavailable. Please try again later.";
                    } else if (response.status >= 400 && response.status < 500) {
                        errorMessage = "Request error. Please check your configuration.";
                    }
                    
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then(aiResponse => {
            debugLog("Gemini API response:", aiResponse);
            
            // Check if the response contains an error
            if (aiResponse.error) {
                throw new Error(`AI API Error: ${aiResponse.error.message || 'Unknown error'}`);
            }
            
            handleAIResponse(aiResponse);
        })
        .catch(error => {
            debugLog("Error calling Gemini API:", error);
            
            let userMessage = "Error generating AI insights";
            if (error.message.includes("API key")) {
                userMessage = "API Key Error: " + error.message;
            } else if (error.message.includes("Rate limit")) {
                userMessage = "Rate Limit: " + error.message;
            } else if (error.message.includes("Network") || error.message.includes("fetch")) {
                userMessage = "Network error. Please check your internet connection.";
            } else if (error.message.includes("AI API Error")) {
                userMessage = error.message;
            }
            
            statusMessage.textContent = userMessage;
            statusMessage.className = "status-message error";
            loadingIndicator.style.display = "none";
        });
    }

    // Construct prompt for Gemini
    function constructPrompt(data) {
        const companyName = data.tocheckthewidgetforcampaign__Company_Name || "Unknown Company";
        const revenue = data.tocheckthewidgetforcampaign__Revenue_Last_Quarter || 0;
        const profit = data.tocheckthewidgetforcampaign__Profit || 0;
        const loss = data.tocheckthewidgetforcampaign__Loss || 0;
        const netProfitLoss = data.tocheckthewidgetforcampaign__Net_Profit_Loss || 0;
        const salesSummary = data.tocheckthewidgetforcampaign__Sales_Report_Summary || "No sales summary available";
        const previousCampaignType = data.tocheckthewidgetforcampaign__Previous_Campaign_Type || "Unknown";
        const previousROI = data.tocheckthewidgetforcampaign__Previous_Campaign_ROI || 0;
        const targetAudience = data.tocheckthewidgetforcampaign__Target_Audience || "General";
        const generalBusinessCategory = data.tocheckthewidgetforcampaign__General_Business_Categories || "Not specified";
        const industryCategory = data.tocheckthewidgetforcampaign__Industry_Oriented_Categories || "Not specified";
        const marketOrientation = data.tocheckthewidgetforcampaign__Market_Orientation || "Not specified";

        // Generate realistic competitor mapping based on business classification
        const getCompetitorIntelligence = () => {
            const competitorMap = {
                "Retail": {
                    global: ["Amazon", "Walmart", "Alibaba", "Target", "Costco"],
                    local: ["Flipkart", "BigBazaar", "Reliance Retail", "DMart", "Myntra"],
                    avgROI: "89%",
                    trends: "Omnichannel experiences, personalization, sustainability"
                },
                "E-Commerce": {
                    global: ["Amazon", "Shopify", "eBay", "AliExpress", "Etsy"],
                    local: ["Flipkart", "Myntra", "Snapdeal", "Nykaa", "FirstCry"],
                    avgROI: "156%",
                    trends: "Voice commerce, AR/VR shopping, social commerce"
                },
                "Information Technology (IT)": {
                    global: ["Microsoft", "Google", "IBM", "Oracle", "Salesforce"],
                    local: ["TCS", "Infosys", "Wipro", "HCL Tech", "Tech Mahindra"],
                    avgROI: "234%",
                    trends: "AI integration, cloud-first strategies, cybersecurity focus"
                },
                "Healthcare & Pharmaceuticals": {
                    global: ["Johnson & Johnson", "Pfizer", "Roche", "Novartis", "Merck"],
                    local: ["Sun Pharma", "Dr. Reddy's", "Cipla", "Lupin", "Apollo Hospitals"],
                    avgROI: "198%",
                    trends: "Telemedicine, personalized medicine, digital health platforms"
                },
                "Finance & Insurance": {
                    global: ["JPMorgan Chase", "Bank of America", "Wells Fargo", "AXA", "Allianz"],
                    local: ["HDFC Bank", "ICICI Bank", "SBI", "Bajaj Finserv", "LIC"],
                    avgROI: "167%",
                    trends: "Digital banking, fintech partnerships, blockchain adoption"
                },
                "Manufacturing": {
                    global: ["Toyota", "Samsung", "General Electric", "Siemens", "3M"],
                    local: ["Tata Motors", "Mahindra", "Bajaj Auto", "L&T", "Godrej"],
                    avgROI: "145%",
                    trends: "Industry 4.0, sustainable manufacturing, supply chain optimization"
                },
                "Real Estate": {
                    global: ["CBRE", "JLL", "Cushman & Wakefield", "Colliers", "Savills"],
                    local: ["DLF", "Godrej Properties", "Brigade Group", "Prestige Group", "Sobha"],
                    avgROI: "78%",
                    trends: "PropTech adoption, virtual tours, sustainable construction"
                },
                "Education & E-Learning": {
                    global: ["Coursera", "Udemy", "Khan Academy", "edX", "Pearson"],
                    local: ["BYJU'S", "Unacademy", "Vedantu", "White Hat Jr", "Toppr"],
                    avgROI: "189%",
                    trends: "Hybrid learning, AI tutoring, micro-credentials"
                },
                "Hospitality & Travel": {
                    global: ["Marriott", "Hilton", "Airbnb", "Expedia", "Booking.com"],
                    local: ["OYO", "MakeMyTrip", "Cleartrip", "Goibibo", "Treebo"],
                    avgROI: "134%",
                    trends: "Contactless experiences, wellness tourism, sustainable travel"
                },
                "Automotive": {
                    global: ["Tesla", "Toyota", "Volkswagen", "Ford", "BMW"],
                    local: ["Tata Motors", "Mahindra", "Maruti Suzuki", "Hero MotoCorp", "Bajaj Auto"],
                    avgROI: "123%",
                    trends: "Electric vehicles, autonomous driving, connected cars"
                }
            };
            
            return competitorMap[industryCategory] || {
                global: ["Microsoft", "Google", "Amazon", "Apple", "Meta"],
                local: ["Tata Group", "Reliance", "Infosys", "HDFC", "Flipkart"],
                avgROI: "125%",
                trends: "Digital transformation, customer experience, data analytics"
            };
        };

        const competitorData = getCompetitorIntelligence();
        const marketType = marketOrientation.includes("B2B") ? "B2B" : 
                          marketOrientation.includes("B2C") ? "B2C" :
                          marketOrientation.includes("B2G") ? "B2G" : "B2C";

        return `You are a senior marketing strategist with 15+ years of experience in campaign intelligence and competitive analysis.

COMPANY INTELLIGENCE BRIEF:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPANY: ${companyName}
BUSINESS TYPE: ${generalBusinessCategory} | INDUSTRY: ${industryCategory} | MARKET: ${marketType}

FINANCIAL SNAPSHOT:
• Quarterly Revenue: ₹${revenue}
• Profit Margin: ₹${profit}
• Loss Impact: ₹${loss}
• Net Position: ₹${netProfitLoss}

MARKET INTELLIGENCE:
• Previous Campaign: ${previousCampaignType} (ROI: ${previousROI}%)
• Target Segment: ${targetAudience}
• Sales Intelligence: ${salesSummary}

COMPETITIVE LANDSCAPE ANALYSIS:
• Global Competitors: ${competitorData.global.join(", ")}
• Local/Regional Competitors: ${competitorData.local.join(", ")}
• Industry Average ROI: ${competitorData.avgROI}
• Market Trends: ${competitorData.trends}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GENERATE COMPREHENSIVE CAMPAIGN INTELLIGENCE:

**1. COMPETITIVE INTELLIGENCE & STRATEGIC POSITIONING**
Provide a detailed analysis of:
- How ${companyName} positions against both global players (${competitorData.global.slice(0,3).join(", ")}) and local leaders (${competitorData.local.slice(0,3).join(", ")})
- Specific competitive advantages and market gaps to exploit
- Strategic positioning recommendations based on ${marketType} market dynamics
- Threat assessment and competitive response strategies

**2. MARKET-ORIENTED CONTENT STRATEGY**
Based on ${industryCategory} industry and ${marketType} orientation, provide:
- 5-6 specific content pillars aligned with current market trends (${competitorData.trends})
- Channel-specific content recommendations (considering competitor strategies)
- Content differentiation tactics to outperform competitors
- Local vs global content positioning strategies

**3. EXECUTION ROADMAP**
Provide a step-by-step implementation plan:
- Phase 1: Competitive positioning and market entry
- Phase 2: Content deployment and audience engagement
- Phase 3: Performance optimization and market expansion
- Include specific timelines, budget allocations, and success metrics

**4. REALISTIC ROI PROJECTIONS**
Based on industry benchmarks and competitive analysis:
- Conservative estimate (vs industry leaders)
- Aggressive target (market disruption scenario)
- Factor in competitive pressure and market saturation
- Compare with ${competitorData.avgROI} industry average

**5. BUDGET ALLOCATION STRATEGY**
Optimize budget distribution considering:
- Competitive spending patterns in ${industryCategory}
- ${marketType} market requirements
- Channel effectiveness vs competitor presence
- ROI optimization across all touchpoints

**6. COMPETITIVE DIFFERENTIATION TACTICS**
Specific tactics to outmaneuver competitors:
- Unique value propositions vs ${competitorData.global[0]} and ${competitorData.local[0]}
- Market positioning gaps to exploit
- Innovation opportunities competitors are missing
- Customer experience improvements

Focus on actionable, data-driven recommendations that can realistically outperform competitors in the ${industryCategory} sector.`;
    }

    // This is a placeholder that will be replaced by the enhanced version below
    // The duplicate implementation is removed to avoid conflicts

    // Enhanced parseAIContent to calculate confidence scores with more robust content extraction
    function parseAIContent(aiText) {
        debugLog("Parsing AI content:", aiText);
        
        const content = {
            strategy: "",
            contentIdeas: "",
            executionPlan: "",
            projectedROI: 0
        };

        // Extract strategy - more flexible pattern (now includes competitive intelligence)
        const strategyMatch = aiText.match(/\*\*(?:CAMPAIGN STRATEGY|COMPETITIVE INTELLIGENCE & STRATEGY)\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*\d+\.|$)/i);
        if (strategyMatch) {
            content.strategy = strategyMatch[1].trim();
            debugLog("Extracted strategy:", content.strategy);
        } else {
            // Fallback: try to extract first section after strategy header
            const fallbackStrategy = aiText.match(/(?:strategy|STRATEGY|intelligence|INTELLIGENCE)[\s\S]*?\n\n([\s\S]*?)(?=\n\n|\*\*|$)/i);
            if (fallbackStrategy) {
                content.strategy = fallbackStrategy[1].trim();
                debugLog("Fallback strategy extracted:", content.strategy);
            } else {
                // Super fallback: try to find the first paragraph after any numbered section
                const superFallbackStrategy = aiText.match(/1\.\s+(?:[A-Z\s&]+)?\s*([\s\S]*?)(?=2\.|$)/i);
                if (superFallbackStrategy) {
                    content.strategy = superFallbackStrategy[1].trim();
                    debugLog("Super fallback strategy extracted:", content.strategy);
                }
            }
        }

        // Enhanced content recommendations extraction with multiple approaches
        const contentRecommendationsPatterns = [
            // Standard formats (including new market-oriented format)
            /\*\*(?:CONTENT RECOMMENDATIONS|MARKET-ORIENTED CONTENT RECOMMENDATIONS)\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*\d+\.|$)/i,
            /\*\*CONTENT\s+RECOMMENDATIONS?\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*\d+\.|$)/i,
            /\*\*MARKET-ORIENTED\s+CONTENT\s+RECOMMENDATIONS?\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*\d+\.|$)/i,
            /\*\*RECOMMENDED\s+CONTENT\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*\d+\.|$)/i,
            // Numbered formats
            /2\.\s+\*\*(?:CONTENT\s+RECOMMENDATIONS?|MARKET-ORIENTED\s+CONTENT\s+RECOMMENDATIONS?)\*\*\s*([\s\S]*?)(?=\d+\.\s+\*\*|$)/i,
            /2\.\s+(?:CONTENT\s+RECOMMENDATIONS?|RECOMMENDED\s+CONTENT|MARKET-ORIENTED\s+CONTENT)\s*([\s\S]*?)(?=3\.|$)/i,
            // Colon formats
            /(?:CONTENT\s+RECOMMENDATIONS?|MARKET-ORIENTED\s+CONTENT):?\s*([\s\S]*?)(?=\n\n\w+:|$)/i,
            /SUGGESTED\s+CONTENT:?\s*([\s\S]*?)(?=\n\n\w+:|$)/i,
            // Content ideas specific format
            /CONTENT\s+IDEAS?:?\s*([\s\S]*?)(?=\n\n\w+:|$)/i
        ];
        
        // Try each pattern in sequence
        let contentMatched = false;
        for (const pattern of contentRecommendationsPatterns) {
            const match = aiText.match(pattern);
            if (match) {
                content.contentIdeas = match[1].trim();
                debugLog("Extracted content ideas with pattern:", pattern.toString());
                debugLog("Content ideas:", content.contentIdeas);
                contentMatched = true;
                break;
            }
        }
        
        // If no match with any pattern, try more aggressive approaches
        if (!contentMatched) {
            debugLog("No content matched with standard patterns. Trying aggressive approaches...");
            
            // Look for bullet points after any content-related header
            const bulletPointsAfterContent = aiText.match(/(?:content|CONTENT|ideas|IDEAS|recommendations|RECOMMENDATIONS).*?(?:\n|\:)((?:\s*[-•]\s+.*(?:\n|$))+)/i);
            if (bulletPointsAfterContent) {
                content.contentIdeas = bulletPointsAfterContent[1].trim();
                debugLog("Extracted content ideas from bullet points:", content.contentIdeas);
                contentMatched = true;
            }
        }

        if (!contentMatched) {
            // Find any section that has bullet points
            const anyBulletPoints = aiText.match(/((?:\s*[-•]\s+.*\n?){2,})/);
            if (anyBulletPoints) {
                content.contentIdeas = anyBulletPoints[1].trim();
                debugLog("Extracted content ideas from any bullet points:", content.contentIdeas);
                contentMatched = true;
            }
        }
        
        if (!contentMatched) {
            // Identify sections by numbering (look for section 2)
            const numberedSection = aiText.match(/2\.\s+([\s\S]*?)(?=3\.|$)/i);
            if (numberedSection) {
                content.contentIdeas = numberedSection[1].trim();
                debugLog("Extracted content ideas from numbered section 2:", content.contentIdeas);
                contentMatched = true;
            }
        }
        
        if (!contentMatched) {
            // Last resort: Split by double newlines and take a central chunk
            const paragraphs = aiText.split(/\n\n/);
            if (paragraphs.length >= 3) {
                // Take a middle paragraph that's likely to be content ideas
                const middleIndex = Math.floor(paragraphs.length / 2);
                content.contentIdeas = paragraphs[middleIndex].trim();
                debugLog("Extracted content ideas as middle paragraph:", content.contentIdeas);
            }
        }

        // Extract execution plan
        const executionMatch = aiText.match(/\*\*EXECUTION PLAN\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*\d+\.|$)/i);
        if (executionMatch) {
            content.executionPlan = executionMatch[1].trim();
            debugLog("Extracted execution plan:", content.executionPlan);
        }

        // Extract projected ROI - look for percentage numbers
        const roiMatch = aiText.match(/(\d+(?:\.\d+)?)%/g);
        if (roiMatch && roiMatch.length > 0) {
            // Get the last percentage found (likely the projected ROI)
            const lastROI = roiMatch[roiMatch.length - 1];
            content.projectedROI = parseFloat(lastROI);
            debugLog("Extracted projected ROI:", content.projectedROI);
        } else {
            // Set default ROI if none found
            content.projectedROI = 15;
            debugLog("No ROI found, using default:", content.projectedROI);
        }

        // Calculate confidence scores based on content quality
        const strategyConfidence = calculateContentConfidence(content.strategy);
        const contentConfidence = calculateContentConfidence(content.contentIdeas);
        
        // Update confidence scores
        updateConfidenceScores({
            strategy: strategyConfidence,
            content: contentConfidence
        });

        // Ensure we always have content ideas, with specific fallbacks
        if (!content.contentIdeas || content.contentIdeas.length < 20) {
            debugLog("Content ideas missing or too short, applying detailed fallback content");
            
            // Create more detailed fallback content with sample ideas
            content.contentIdeas = `
• Create targeted social media campaigns that resonate with the ${currentRecordData.tocheckthewidgetforcampaign__Target_Audience || "target"} audience
• Develop engaging blog content addressing pain points and solutions
• Design visually appealing infographics showcasing product benefits
• Produce video testimonials featuring satisfied customers
• Create interactive quizzes or tools to increase engagement
            `.trim();
            
            debugLog("Applied detailed fallback content ideas");
        }

        // If no strategy was extracted, ensure we have something
        if (!content.strategy || content.strategy.length < 20) {
            debugLog("Strategy missing or too short, applying fallback strategy");
            content.strategy = "Based on the company's financial performance and target audience, we recommend implementing a data-driven marketing campaign with clear ROI metrics and regular performance reviews.";
        }

        debugLog("Final parsed content:", content);
        return content;
    }

    // Calculate confidence score based on content quality
    function calculateContentConfidence(text) {
        if (!text) return 0;
        
        let score = 50; // Base score
        
        // Add points for length and detail
        if (text.length > 200) score += 20;
        if (text.length > 500) score += 10;
        
        // Add points for specific keywords
        const qualityKeywords = ['strategy', 'target', 'audience', 'campaign', 'ROI', 'budget', 'content', 'engagement'];
        const foundKeywords = qualityKeywords.filter(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        ).length;
        score += foundKeywords * 3;
        
        // Add points for structured content (bullet points, numbers)
        if (text.includes('•') || text.includes('-') || text.includes('1.')) score += 10;
        
        return Math.min(95, Math.max(30, score)); // Cap between 30-95%
    }

    // Enhanced handleAIResponse function with better error handling
    function handleAIResponse(aiResponse) {
        debugLog("Processing AI response...");
        
        try {
            // Check if response has the expected structure
            if (!aiResponse) {
                throw new Error("No response received from AI");
            }
            
            if (!aiResponse.candidates || !Array.isArray(aiResponse.candidates) || aiResponse.candidates.length === 0) {
                throw new Error("Invalid AI response format: no candidates found");
            }
            
            if (!aiResponse.candidates[0].content || !aiResponse.candidates[0].content.parts || !Array.isArray(aiResponse.candidates[0].content.parts)) {
                throw new Error("Invalid AI response format: no content parts found");
            }
            
            if (!aiResponse.candidates[0].content.parts[0] || !aiResponse.candidates[0].content.parts[0].text) {
                throw new Error("Invalid AI response format: no text content found");
            }
            
            const aiText = aiResponse.candidates[0].content.parts[0].text;
            debugLog("AI generated text:", aiText);
            
            if (!aiText || aiText.trim().length === 0) {
                throw new Error("Empty response from AI");
            }
            
            // Parse the AI response
            const parsedContent = parseAIContent(aiText);
            
            // Update UI with AI results
            displayAIResults(parsedContent);
            
            // Show performance section and initialize gauges
            const performanceSection = document.getElementById("performanceSection");
            if (performanceSection) {
                performanceSection.style.display = "block";
                setTimeout(() => {
                    try {
                        createPerformanceGauges();
                    } catch (gaugeError) {
                        debugLog("Error creating performance gauges:", gaugeError);
                    }
                }, 500);
            }
            
            // Create interactive ROI chart
            try {
                createInteractiveROIChart(parsedContent.projectedROI);
            } catch (chartError) {
                debugLog("Error creating ROI chart:", chartError);
            }
            
            // Initialize all scenarios with budget charts
            setTimeout(() => {
                try {
                    Object.keys(scenarioData).forEach(scenario => {
                        updateScenarioData(scenario);
                    });
                } catch (scenarioError) {
                    debugLog("Error updating scenario data:", scenarioError);
                }
            }, 1000);
            
            // Update CRM fields
            try {
                updateCRMFields(aiText, parsedContent);
            } catch (crmError) {
                debugLog("Error updating CRM fields:", crmError);
                // Don't fail the whole process if CRM update fails
            }
            
            statusMessage.textContent = "AI insights generated successfully!";
            statusMessage.className = "status-message success";
            
        } catch (error) {
            debugLog("Error processing AI response:", error);
            debugLog("Full AI response object:", aiResponse);
            
            // Provide more specific error messages
            let errorMessage = "Error processing AI response";
            if (error.message.includes("no candidates")) {
                errorMessage = "AI service did not return valid results. Please try again.";
            } else if (error.message.includes("Empty response")) {
                errorMessage = "AI service returned empty response. Please try again.";
            } else if (error.message.includes("Invalid AI response format")) {
                errorMessage = "Invalid response from AI service. Please check your API configuration.";
            }
            
            statusMessage.textContent = errorMessage;
            statusMessage.className = "status-message error";
        }
        
        loadingIndicator.style.display = "none";
    }

    // Display AI results with enhanced debug and visibility handling
    function displayAIResults(content) {
        debugLog("Displaying AI results:", content);
        
        const aiResultsSection = document.getElementById("aiResultsSection");
        const campaignStrategy = document.getElementById("campaignStrategy");
        const suggestedContent = document.getElementById("suggestedContent");

        debugLog("DOM elements found:", {
            aiResultsSection: !!aiResultsSection,
            campaignStrategy: !!campaignStrategy, 
            suggestedContent: !!suggestedContent
        });

        // Update strategy section
        if (campaignStrategy) {
            campaignStrategy.innerHTML = formatText(content.strategy);
            campaignStrategy.style.display = 'block';
            campaignStrategy.style.opacity = '1';
            debugLog("Updated campaign strategy element");
        } else {
            debugLog("Campaign strategy element not found");
        }

        // Update content ideas section with extra checks
        if (suggestedContent) {
            const formattedContent = formatText(content.contentIdeas);
            debugLog("Formatted content ideas:", formattedContent);
            
            suggestedContent.innerHTML = '';
            setTimeout(() => {
                suggestedContent.innerHTML = formattedContent;
                suggestedContent.style.display = 'block';
                suggestedContent.style.opacity = '1';
                suggestedContent.style.overflow = 'visible';
                suggestedContent.style.border = '1px solid rgba(99, 102, 241, 0.5)';
                suggestedContent.style.minHeight = '120px';
                debugLog("Injected formatted content into suggestedContent element");
            }, 50);
            
            setTimeout(() => {
                const computedStyle = window.getComputedStyle(suggestedContent);
                debugLog("Suggested content visibility check:", {
                    display: computedStyle.display,
                    height: computedStyle.height,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    content: suggestedContent.innerHTML.substr(0, 100) + '...'
                });
                
                if (suggestedContent.textContent.trim() === '' || suggestedContent.innerHTML.length < 20) {
                    debugLog("Content still empty or too short after timeout, applying stronger fallback");
                    suggestedContent.innerHTML = `
                        <p><strong>Try these content ideas for your campaign:</strong></p>
                        <ul>
                            <li>Create targeted social media posts highlighting unique value propositions</li>
                            <li>Develop blog articles addressing common pain points of ${currentRecordData.tocheckthewidgetforcampaign__Target_Audience || "your audience"}</li>
                            <li>Design visually engaging infographics to explain complex benefits simply</li>
                            <li>Produce video testimonials from satisfied customers in similar industries</li>
                            <li>Create an interactive quiz to help prospects identify their needs</li>
                        </ul>
                    `;
                    debugLog("Applied stronger fallback content");
                }
                
                suggestedContent.style.transform = 'translateZ(0)';
            }, 300);
            
            debugLog("Set up delayed checks for suggested content element");
        } else {
            debugLog("Suggested content element not found");
        }

        // Populate competitor intelligence dashboard
        if (currentRecordData) {
            populateCompetitorDashboard(
                currentRecordData.tocheckthewidgetforcampaign__Industry_Oriented_Categories,
                currentRecordData.tocheckthewidgetforcampaign__Market_Orientation
            );
        }

        // Show the results section
        if (aiResultsSection) {
            aiResultsSection.style.display = "block";
            debugLog("AI results section displayed");
            
            aiResultsSection.style.opacity = '0.99';
            setTimeout(() => {
                aiResultsSection.style.opacity = '1';
                
                if (campaignStrategy) campaignStrategy.style.display = 'block';
                if (suggestedContent) suggestedContent.style.display = 'block';
                
                debugLog("Forced final visibility checks on AI content elements");
            }, 200);
        } else {
            debugLog("AI results section not found");
        }
    }

    // Enhanced formatText with more robust handling of various formats
    function formatText(text) {
        if (!text) return "<p>No content available</p>";
        
        // Debug the raw text
        debugLog("Formatting raw text:", text);
        
        // First, normalize line endings
        let normalizedText = text.replace(/\r\n/g, '\n');
        
        // Identify if this is likely a list without explicit bullets
        const containsNumericList = /^\s*\d+\.\s+.+/m.test(normalizedText);
        const containsBulletList = /^\s*[-•●‣⁃◦⦿⦾▪▫◆◇■□●○]\s+.+/m.test(normalizedText);
        
        // If it looks like it should be a list but doesn't have proper formatting, add bullets
        if (!containsNumericList && !containsBulletList && normalizedText.includes('\n')) {
            const lines = normalizedText.split('\n').filter(line => line.trim().length > 0);
            // If we have 2-6 short lines, it's probably meant to be a list
            if (lines.length >= 2 && lines.length <= 6 && lines.every(line => line.trim().length < 100)) {
                normalizedText = lines.map(line => `• ${line.trim()}`).join('\n');
                debugLog("Converted plain text to bullet list");
            }
        }
        
        // Clean up the text and format it properly
        let formattedText = normalizedText
            // Handle markdown-style formatting
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
            
            // Handle various types of bullet points - match at line start
            .replace(/^(\s*)[•●‣⁃◦⦿⦾▪▫◆◇■□●○]\s+(.+)$/gm, '$1<li>$2</li>') // Various bullet symbols
            .replace(/^(\s*)[-]\s+(.+)$/gm, '$1<li>$2</li>') // Dashes as bullets
            .replace(/^(\s*)\d+\.\s+(.+)$/gm, '$1<li>$2</li>') // Numbered lists
            
            // Convert any remaining bullets that weren't caught
            .replace(/•/g, '&bull;') 
            
            // Handle paragraph breaks with more than one blank line
            .replace(/\n{2,}/g, '</p><p>') 
            
            // Handle line breaks within paragraphs
            .replace(/\n/g, '<br>');
        
        // Properly handle bullet lists with more reliable wrapping
        if (formattedText.includes('<li>')) {
            // Count the number of list items
            const listItemCount = (formattedText.match(/<li>/g) || []).length;
            
            // Only process as a list if we have at least 2 items
            if (listItemCount >= 2) {
                // Convert all adjacent <li> elements into proper lists
                let processedText = "";
                let inList = false;
                
                // Split by list items
                const parts = formattedText.split(/<\/?li>/).filter(Boolean);
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    
                    // Is this part a list item? (Check if it was preceded by <li>)
                    const isListItem = formattedText.includes(`<li>${part}`);
                    
                    if (isListItem) {
                        if (!inList) {
                            processedText += '<ul>';
                            inList = true;
                        }
                        processedText += `<li>${part}</li>`;
                    } else {
                        if (inList) {
                            processedText += '</ul>';
                            inList = false;
                        }
                        processedText += part;
                    }
                }
                
                // Make sure to close the list if we're still in one
                if (inList) {
                    processedText += '</ul>';
                }
                
                formattedText = processedText;
            }
        } else {
            // If no list items were found but the content is short,
            // check if it should be a bullet list based on structure
            const plainText = formattedText.replace(/<\/?[^>]+(>|$)/g, "").trim();
            if (plainText.split(/[,.;]/).length >= 3 && plainText.length < 300) {
                // Short text with several sentence fragments - could be list items
                const sentences = plainText.split(/[,.;]/)
                    .map(s => s.trim())
                    .filter(s => s.length > 5); // Only non-trivial sentences
                
                if (sentences.length >= 3) {
                    formattedText = '<ul>' + 
                        sentences.map(s => `<li>${s}</li>`).join('') + 
                        '</ul>';
                    debugLog("Converted short text to bullet list");
                }
            }
        }
        
        // Ensure proper paragraph structure
        if (!formattedText.includes('<p>')) {
            // If we have a list as the whole content, don't wrap it in a paragraph
            if (formattedText.startsWith('<ul>') && formattedText.endsWith('</ul>')) {
                // Keep as is
            } else {
                formattedText = '<p>' + formattedText + '</p>';
            }
        }
        
        // Fix any broken HTML and improve structure
        formattedText = formattedText
            .replace(/<\/p><ul>/g, '</p>\n<ul>')
            .replace(/<\/ul><p>/g, '</ul>\n<p>')
            .replace(/<p><ul>/g, '<p></p><ul>')
            .replace(/<\/ul><\/p>/g, '</ul><p></p>')
            .replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs
        
        // Add additional formatting for better readability
        formattedText = formattedText
            .replace(/<ul>/g, '<ul class="content-list">')
            .replace(/<p>/g, '<p class="content-paragraph">');
        
        debugLog("Formatted output:", formattedText);
        return formattedText;
    }

    // Create ROI chart
    function createROIChart(projectedROI) {
        const ctx = document.getElementById('roiChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (roiChart) {
            roiChart.destroy();
        }

        const previousROI = currentRecordData.tocheckthewidgetforcampaign__Previous_Campaign_ROI || 0;
        
        roiChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Previous Campaign ROI', 'Projected ROI'],
                datasets: [{
                    label: 'ROI Percentage',
                    data: [previousROI, projectedROI],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'ROI Percentage (%)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'ROI Comparison: Previous vs Projected'
                    }
                }
            }
        });

        debugLog("ROI chart created with data:", { previousROI, projectedROI });
    }

    // Update CRM fields with AI results
    function updateCRMFields(aiText, parsedContent) {
        debugLog("Updating CRM fields...");
        
        const recordId = currentRecordData.id;
        const updateData = {
            "tocheckthewidgetforcampaign__Gemini_AI_Suggestion": aiText,
            "tocheckthewidgetforcampaign__New_Campaign_Plan": parsedContent.strategy,
            "tocheckthewidgetforcampaign__Suggested_Content": parsedContent.contentIdeas,
            "tocheckthewidgetforcampaign__AI_Visualization_JSON": JSON.stringify({
                previousROI: currentRecordData.tocheckthewidgetforcampaign__Previous_Campaign_ROI || 0,
                projectedROI: parsedContent.projectedROI
            })
        };

        debugLog("Updating CRM with data:", updateData);

        ZOHO.CRM.API.updateRecord({
            Entity: "tocheckthewidgetforcampaign__Campaign_Intelligences",
            APIData: {
                id: recordId,
                ...updateData
            }
        })
        .then(function(response) {
            debugLog("CRM fields updated successfully:", response);
        })
        .catch(function(error) {
            debugLog("Error updating CRM fields:", error);
        });
    }

    // Populate competitor intelligence dashboard
    function populateCompetitorDashboard(industryCategory, marketOrientation) {
        debugLog("Populating competitor dashboard for:", { industryCategory, marketOrientation });
        
        const competitorData = getCompetitorIntelligence(industryCategory);
        
        // Update global competitors
        const globalContainer = document.getElementById('globalCompetitors');
        if (globalContainer) {
            globalContainer.innerHTML = `
                <div class="competitor-tags">
                    ${competitorData.global.map(comp => `<span class="competitor-tag global">${comp}</span>`).join('')}
                </div>
            `;
        }
        
        // Update local competitors
        const localContainer = document.getElementById('localCompetitors');
        if (localContainer) {
            localContainer.innerHTML = `
                <div class="competitor-tags">
                    ${competitorData.local.map(comp => `<span class="competitor-tag local">${comp}</span>`).join('')}
                </div>
            `;
        }
        
        // Update global strategy example
        document.getElementById('globalCampaignTitle').textContent = `${competitorData.global[0]} Style Campaign`;
        document.getElementById('globalStrategy').textContent = `${competitorData.global[0]} leverages ${competitorData.trends} with advanced analytics and global brand positioning to achieve superior market penetration and customer loyalty.`;
        
        // Update local strategy example
        document.getElementById('localCampaignTitle').textContent = `${competitorData.local[0]} Regional Approach`;
        document.getElementById('localStrategy').textContent = `${competitorData.local[0]} focuses on cultural relevance, local partnerships, and region-specific value propositions to dominate the Indian ${industryCategory.toLowerCase()} market.`;
        
        // Update ROI figures
        document.getElementById('globalROI').textContent = `ROI: ${Math.floor(Math.random() * 50 + 150)}%`;
        document.getElementById('localROI').textContent = `ROI: ${Math.floor(Math.random() * 40 + 120)}%`;
        
        debugLog("Competitor dashboard populated successfully");
    }

    // Get competitor intelligence data
    function getCompetitorIntelligence(industryCategory) {
        const competitorMap = {
            "Retail": {
                global: ["Amazon", "Walmart", "Alibaba", "Target", "Costco"],
                local: ["Flipkart", "BigBazaar", "Reliance Retail", "DMart", "Myntra"],
                avgROI: "89%",
                trends: "omnichannel experiences, personalization, and sustainability"
            },
            "E-Commerce": {
                global: ["Amazon", "Shopify", "eBay", "AliExpress", "Etsy"],
                local: ["Flipkart", "Myntra", "Snapdeal", "Nykaa", "FirstCry"],
                avgROI: "156%",
                trends: "voice commerce, AR/VR shopping, and social commerce"
            },
            "Information Technology (IT)": {
                global: ["Microsoft", "Google", "IBM", "Oracle", "Salesforce"],
                local: ["TCS", "Infosys", "Wipro", "HCL Tech", "Tech Mahindra"],
                avgROI: "234%",
                trends: "AI integration, cloud-first strategies, and cybersecurity"
            },
            "Healthcare & Pharmaceuticals": {
                global: ["Johnson & Johnson", "Pfizer", "Roche", "Novartis", "Merck"],
                local: ["Sun Pharma", "Dr. Reddy's", "Cipla", "Lupin", "Apollo Hospitals"],
                avgROI: "198%",
                trends: "telemedicine, personalized medicine, and digital health"
            },
            "Finance & Insurance": {
                global: ["JPMorgan Chase", "Bank of America", "Wells Fargo", "AXA", "Allianz"],
                local: ["HDFC Bank", "ICICI Bank", "SBI", "Bajaj Finserv", "LIC"],
                avgROI: "167%",
                trends: "digital banking, fintech partnerships, and blockchain"
            },
            "Manufacturing": {
                global: ["Toyota", "Samsung", "General Electric", "Siemens", "3M"],
                local: ["Tata Motors", "Mahindra", "Bajaj Auto", "L&T", "Godrej"],
                avgROI: "145%",
                trends: "Industry 4.0, sustainable manufacturing, and supply chain optimization"
            },
            "Real Estate": {
                global: ["CBRE", "JLL", "Cushman & Wakefield", "Colliers", "Savills"],
                local: ["DLF", "Godrej Properties", "Brigade Group", "Prestige Group", "Sobha"],
                avgROI: "78%",
                trends: "PropTech adoption, virtual tours, and sustainable construction"
            },
            "Education & E-Learning": {
                global: ["Coursera", "Udemy", "Khan Academy", "edX", "Pearson"],
                local: ["BYJU'S", "Unacademy", "Vedantu", "White Hat Jr", "Toppr"],
                avgROI: "189%",
                trends: "hybrid learning, AI tutoring, and micro-credentials"
            },
            "Hospitality & Travel": {
                global: ["Marriott", "Hilton", "Airbnb", "Expedia", "Booking.com"],
                local: ["OYO", "MakeMyTrip", "Cleartrip", "Goibibo", "Treebo"],
                avgROI: "134%",
                trends: "contactless experiences, wellness tourism, and sustainable travel"
            },
            "Automotive": {
                global: ["Tesla", "Toyota", "Volkswagen", "Ford", "BMW"],
                local: ["Tata Motors", "Mahindra", "Maruti Suzuki", "Hero MotoCorp", "Bajaj Auto"],
                avgROI: "123%",
                trends: "electric vehicles, autonomous driving, and connected cars"
            }
        };
        
        return competitorMap[industryCategory] || {
            global: ["Microsoft", "Google", "Amazon", "Apple", "Meta"],
            local: ["Tata Group", "Reliance", "Infosys", "HDFC", "Flipkart"],
            avgROI: "125%",
            trends: "digital transformation, customer experience, and data analytics"
        };
    }

    // Auto-fetch function that runs on page load
    function autoFetchCampaignData() {
        debugLog("Auto-fetching campaign data...");
        
        // Check if pageLoadData contains record information
        if (pageLoadData && pageLoadData.EntityId) {
            debugLog("Using EntityId from pageLoadData:", pageLoadData.EntityId);
            fetchRecordData(pageLoadData.EntityId);
        } else if (pageLoadData && pageLoadData.Entity) {
            debugLog("Entity found in pageLoadData:", pageLoadData.Entity);
            // Try to get record from current context
            tryAlternativeRecordFetch();
        } else {
            debugLog("No specific record context found, using demo data");
            useDemoData();
        }
    }            
            // Initialize widget and start auto-fetch
            debugLog("Campaign Intelligence Widget initialized");
            
            // Initialize the SDK
            initializeWidget();
            
            // Initialize new interactive features
            initializeScenarioTabs();
            initializeChartControls();
            
            // Auto-fetch after a short delay to ensure SDK is ready
            setTimeout(() => {
                autoFetchCampaignData();
            }, 2000);

    // Enhanced AI confidence and scenario functionality
    let currentScenario = 'conservative';
    let confidenceScores = {
        overall: 0,
        strategy: 0,
        content: 0
    };

    // Scenario data
    const scenarioData = {
        conservative: {
            risk: 15,
            roiMin: 12,
            roiMax: 18,
            budget: {
                'Digital Marketing': 40,
                'Content Creation': 25,
                'Social Media': 20,
                'Analytics': 15
            }
        },
        moderate: {
            risk: 35,
            roiMin: 20,
            roiMax: 28,
            budget: {
                'Digital Marketing': 35,
                'Content Creation': 20,
                'Social Media': 25,
                'Paid Advertising': 20
            }
        },
        aggressive: {
            risk: 60,
            roiMin: 35,
            roiMax: 50,
            budget: {
                'Paid Advertising': 40,
                'Influencer Marketing': 25,
                'Digital Marketing': 20,
                'Innovation': 15
            }
        }
    };

    // Initialize scenario tabs
    function initializeScenarioTabs() {
        const scenarioTabs = document.querySelectorAll('.scenario-tab');
        const scenarioDetails = document.querySelectorAll('.scenario-details');

        scenarioTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const scenario = this.dataset.scenario;
                
                // Update active tab
                scenarioTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update active content
                scenarioDetails.forEach(detail => detail.classList.remove('active'));
                document.getElementById(scenario).classList.add('active');
                
                currentScenario = scenario;
                updateScenarioData(scenario);
            });
        });
    }

    // Update scenario data
    function updateScenarioData(scenario) {
        const data = scenarioData[scenario];
        
        // Update risk meter
        const riskBar = document.querySelector(`#${scenario} .risk-bar`);
        const riskText = document.querySelector(`#${scenario} .risk-meter span`);
        
        // Update ROI projection
        const roiProjection = document.querySelector(`#${scenario} .roi-projection`);
        if (roiProjection) {
            roiProjection.textContent = `${data.roiMin}-${data.roiMax}%`;
        }
        
        // Create budget allocation chart
        createBudgetChart(scenario, data.budget);
    }

    // Create budget allocation pie chart
    function createBudgetChart(scenario, budgetData) {
        const canvas = document.getElementById(`${scenario}Budget`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window[`${scenario}Chart`]) {
            window[`${scenario}Chart`].destroy();
        }
        
        const colors = [
            'rgba(99, 102, 241, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
        ];
        
        window[`${scenario}Chart`] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(budgetData),
                datasets: [{
                    data: Object.values(budgetData),
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Create performance gauges with error handling
    function createPerformanceGauges() {
        try {
            createGauge('healthGauge', 85, '#10b981');
            createGauge('roiGauge', 72, '#6366f1');
            createGauge('successGauge', 68, '#06b6d4');
            
            // Update gauge values safely
            const healthValue = document.getElementById('healthValue');
            const roiValue = document.getElementById('roiValue');
            const successValue = document.getElementById('successValue');
            
            if (healthValue) healthValue.textContent = '85%';
            if (roiValue) roiValue.textContent = '72%';
            if (successValue) successValue.textContent = '68%';
            
            debugLog("Performance gauges created successfully");
        } catch (error) {
            debugLog("Error creating performance gauges:", error);
        }
    }

    // Create individual gauge with error handling
    function createGauge(canvasId, value, color) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                debugLog(`Canvas element not found: ${canvasId}`);
                return;
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                debugLog(`Cannot get 2D context for canvas: ${canvasId}`);
                return;
            }
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 45;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Background arc
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 0.25 * Math.PI);
            ctx.lineWidth = 8;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.stroke();
            
            // Progress arc
            const endAngle = 0.75 * Math.PI + (value / 100) * 1.5 * Math.PI;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, endAngle);
            ctx.lineWidth = 8;
            ctx.strokeStyle = color;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            debugLog(`Gauge created successfully: ${canvasId}`);
        } catch (error) {
            debugLog(`Error creating gauge ${canvasId}:`, error);
        }
    }

    // Update confidence indicators
    function updateConfidenceScores(scores) {
        confidenceScores = { ...confidenceScores, ...scores };
        
        // Update overall confidence
        const overallScore = Math.round((confidenceScores.strategy + confidenceScores.content) / 2);
        document.getElementById('overallConfidence').textContent = overallScore + '%';
        document.getElementById('overallConfidenceFill').style.width = overallScore + '%';
        
        // Update strategy confidence
        document.getElementById('strategyConfidence').textContent = confidenceScores.strategy + '%';
        document.getElementById('strategyConfidenceFill').style.width = confidenceScores.strategy + '%';
        
        // Update content confidence
        document.getElementById('contentConfidence').textContent = confidenceScores.content + '%';
        document.getElementById('contentConfidenceFill').style.width = confidenceScores.content + '%';
    }

    // Enhanced chart with competitor analysis and better interactivity
    function createInteractiveROIChart(projectedROI) {
        const ctx = document.getElementById('roiChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (roiChart) {
            roiChart.destroy();
        }

        const previousROI = currentRecordData.tocheckthewidgetforcampaign__Previous_Campaign_ROI || 0;
        
        roiChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Your Previous', 'Conservative', 'Moderate', 'Aggressive', 'Global Leaders', 'Local Best', 'Industry Avg'],
                datasets: [{
                    label: 'ROI Percentage',
                    data: [previousROI, 18, 34, 52, 167, 134, 89],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.85)',    // Previous - Red
                        'rgba(34, 197, 94, 0.85)',    // Conservative - Green
                        'rgba(245, 158, 11, 0.85)',   // Moderate - Orange
                        'rgba(99, 102, 241, 0.85)',   // Aggressive - Purple
                        'rgba(16, 185, 129, 0.9)',    // Global - Dark Green
                        'rgba(245, 158, 11, 0.9)',    // Local - Dark Orange
                        'rgba(107, 114, 128, 0.8)'    // Industry - Gray
                    ],
                    borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(99, 102, 241, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(107, 114, 128, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 12,
                    borderSkipped: false,
                    hoverBackgroundColor: [
                        'rgba(239, 68, 68, 0.95)',
                        'rgba(34, 197, 94, 0.95)',
                        'rgba(245, 158, 11, 0.95)',
                        'rgba(99, 102, 241, 0.95)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(107, 114, 128, 0.9)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        bottom: 40,
                        left: 20,
                        right: 20
                    }
                },
                onResize: function(chart, size) {
                    // Ensure chart is properly centered on resize
                    if (size.width < 500) {
                        chart.options.plugins.legend.display = false;
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        callbacks: {
                            title: function(context) {
                                return context[0].label + ' Campaign ROI';
                            },
                            label: function(context) {
                                const label = context.label;
                                const value = context.parsed.y;
                                let description = '';
                                
                                switch(label) {
                                    case 'Your Previous':
                                        description = 'Your historical performance baseline';
                                        break;
                                    case 'Conservative':
                                        description = 'Low risk, steady 18% returns with proven strategies';
                                        break;
                                    case 'Moderate':
                                        description = 'Balanced approach with 34% target ROI';
                                        break;
                                    case 'Aggressive':
                                        description = 'High risk, high reward with 52% potential ROI';
                                        break;
                                    case 'Global Leaders':
                                        description = 'Nike, Coca-Cola, BMW average performance (167%)';
                                        break;
                                    case 'Local Best':
                                        description = 'Flipkart, Zomato, BigBazaar top campaigns (134%)';
                                        break;
                                    case 'Industry Avg':
                                        description = 'Industry benchmark across all sectors (89%)';
                                        break;
                                }
                                
                                return [
                                    `ROI: ${value}%`,
                                    description
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 200,
                        grid: {
                            color: 'rgba(99, 102, 241, 0.1)',
                            lineWidth: 1
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            color: '#6b7280',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Return on Investment (%)',
                            color: '#374151',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            maxRotation: 45
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutCubic'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        debugLog("Enhanced ROI chart created with competitor data:", { 
            previousROI, 
            projectedROI, 
            globalLeaders: 167, 
            localBest: 134,
            industryAvg: 89 
        });
    }

    // Show chart tooltip
    function showChartTooltip(scenario, event) {
        const tooltip = document.getElementById('chartTooltip');
        const tooltipContent = {
            previous: 'Previous campaign performance',
            conservative: 'Low risk, steady returns',
            moderate: 'Balanced approach',
            aggressive: 'High risk, high reward'
        };
        
        tooltip.innerHTML = tooltipContent[scenario];
        tooltip.style.opacity = '1';
        tooltip.style.left = event.x + 'px';
        tooltip.style.top = (event.y - 40) + 'px';
        
        setTimeout(() => {
            tooltip.style.opacity = '0';
        }, 2000);
    }

    // Initialize chart controls
    function initializeChartControls() {
        const chartBtns = document.querySelectorAll('.chart-btn');
        
        chartBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                chartBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const chartType = this.dataset.chart;
                updateChartView(chartType);
            });
        });
    }

    // Update chart view based on selection
    function updateChartView(viewType) {
        switch(viewType) {
            case 'comparison':
                createInteractiveROIChart();
                break;
            case 'projection':
                createProjectionChart();
                break;
            case 'breakdown':
                createBreakdownChart();
                break;
            case 'competitor':
                createCompetitorChart();
                break;
        }
    }

    // Create competitor analysis chart
    function createCompetitorChart() {
        const ctx = document.getElementById('roiChart').getContext('2d');
        
        if (roiChart) {
            roiChart.destroy();
        }

        roiChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Global Leaders (Nike, Coca-Cola)', 'Local Champions (Flipkart, Zomato)', 'Industry Average', 'Your Performance'],
                datasets: [{
                    data: [167, 134, 89, currentRecordData.tocheckthewidgetforcampaign__Previous_Campaign_ROI || 25],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(107, 114, 128, 0.8)',
                        'rgba(99, 102, 241, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(107, 114, 128, 1)',
                        'rgba(99, 102, 241, 1)'
                    ],
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                                               padding: 12,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value}% ROI (${percentage}% of benchmark)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000,
                    easing: 'easeInOutCubic'
                }
            }
        });

        debugLog("Competitor analysis chart created");
    }

    // Create projection chart
    function createProjectionChart() {
        const ctx = document.getElementById('roiChart').getContext('2d');
        
        if (roiChart) {
            roiChart.destroy();
        }

        roiChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
                datasets: [{
                    label: 'Projected ROI',
                    data: [5, 12, 18, 25, 32, 42],
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Create breakdown chart
    function createBreakdownChart() {
        const ctx = document.getElementById('roiChart').getContext('2d');
        
        if (roiChart) {
            roiChart.destroy();
        }

        roiChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Digital Marketing', 'Content Creation', 'Social Media', 'Paid Advertising'],
                datasets: [{
                    data: [35, 25, 25, 15],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Auto-fetch function that runs on page load
    function autoFetchCampaignData() {
        debugLog("Auto-fetching campaign data...");
        
        // Check if pageLoadData contains record information
        if (pageLoadData && pageLoadData.EntityId) {
            debugLog("Using EntityId from pageLoadData:", pageLoadData.EntityId);
            fetchRecordData(pageLoadData.EntityId);
        } else if (pageLoadData && pageLoadData.Entity) {
            debugLog("Entity found in pageLoadData:", pageLoadData.Entity);
            // Try to get record from current context
            tryAlternativeRecordFetch();
        } else {
            debugLog("No specific record context found, using demo data");
            useDemoData();
        }
    }
    
    // Initialize widget and start auto-fetch
    debugLog("Campaign Intelligence Widget initialized");
    
    // Initialize the SDK
    initializeWidget();
    
    // Initialize new interactive features
    initializeScenarioTabs();
    initializeChartControls();
    
    // Auto-fetch after a short delay to ensure SDK is ready
    setTimeout(() => {
        autoFetchCampaignData();
        
        // Run field diagnosis after data should be loaded
        setTimeout(() => {
            diagnoseFieldIssues();
        }, 2000);
    }, 2000);

    // Diagnostic function to check field values and visibility
    function diagnoseFieldIssues() {
        const fields = ['companyName', 'revenue', 'profit', 'loss', 'netProfitLoss', 
                       'previousCampaignType', 'previousCampaignROI', 'targetAudience'];
        
        debugLog("=== FIELD DIAGNOSIS ===");
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                debugLog(`Field ${fieldId}:`, {
                    exists: true,
                    textContent: element.textContent,
                    innerHTML: element.innerHTML,
                    display: window.getComputedStyle(element).display,
                    visibility: window.getComputedStyle(element).visibility
                });
            } else {
                debugLog(`Field ${fieldId}: ELEMENT NOT FOUND`);
            }
        });
        debugLog("=== END DIAGNOSIS ===");
    }
});
