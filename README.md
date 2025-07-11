# Project Report: Zoho CRM Extension – InfluenceIQ

### Developer: Nikil Logesh

### Extension Name: InfluenceIQ

### Platform: Zoho CRM (Sigma, Widgets, Functions, Custom Modules, API, CRM Variables)

---

## Overview

InfluenceIQ is a Zoho CRM extension designed to automate influencer campaign tracking and analysis. The extension leverages YouTube and Gemini AI to assess public sentiment, track campaign ROI using UTM links, and suggest future campaigns based on data insights.

---

## Objective

The goal of InfluenceIQ is to enable CRM users to:

* Analyze influencer performance from YouTube content
* Generate and monitor UTM campaign links
* Leverage AI to suggest new marketing strategies
* Automatically link influencer activities to leads

---

## Problem Statement

Traditional influencer marketing tracking is manual and fragmented. There is a lack of real-time insights, performance evaluation, and content-driven intelligence in CRM systems. InfluenceIQ addresses these issues by integrating influencer data with AI-driven sentiment analysis and campaign suggestions.

---

## Extension Features

| Feature                      | Description                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| Influencer Sentiment Tracker | Uses YouTube API and Gemini AI to evaluate audience mood from comments |
| Campaign Intelligence Module | Suggests campaign ideas using business and influencer performance data |
| Get UTM Button               | Generates UTM links for tracking leads and source campaigns            |
| YouTube & Instagram Preview  | Quick access to influencer social profiles via CRM                     |

---

## Modules and Structure

### 1. Influencers (Custom Module)

**Custom Fields:**

* Influencer Name (Name)
* Instagram ID (tocheckthewidgetforcampaign\_\_Instagram\_Id)
* YouTube Channel ID (tocheckthewidgetforcampaign\_\_Yt\_Channel\_Id)
* Follower Count (tocheckthewidgetforcampaign\_\_Follower\_count)
* Tier (tocheckthewidgetforcampaign\_\_Tier)
* Rating (tocheckthewidgetforcampaign\_\_Rating)
* Latest Video ID (tocheckthewidgetforcampaign\_\_Latest\_Video\_ID)

### 2. Campaign Intelligence (Custom Module)

**Custom Fields:**

* Gemini AI Suggestion (tocheckthewidgetforcampaign\_\_Gemini\_AI\_Suggestion)
* Previous Campaign ROI (%) (tocheckthewidgetforcampaign\_\_Previous\_Campaign\_ROI)
* New Campaign Plan (tocheckthewidgetforcampaign\_\_New\_Campaign\_Plan)
* Suggested Content (tocheckthewidgetforcampaign\_\_Suggested\_Content)
* Target Audience (tocheckthewidgetforcampaign\_\_Target\_Audience)
* Industry-Oriented Categories (tocheckthewidgetforcampaign\_\_Industry\_Oriented\_Categories)
* AI Visualization JSON (tocheckthewidgetforcampaign\_\_AI\_Visualization\_JSON)

### 3. Leads (Default Module) with UTM Tracking

**Custom Fields:**

* UTM Campaign (tocheckthewidgetforcampaign\_\_UTM\_Campaign)
* UTM Content (tocheckthewidgetforcampaign\_\_UTM\_Content)
* UTM Medium (tocheckthewidgetforcampaign\_\_UTM\_Medium)
* UTM Source (tocheckthewidgetforcampaign\_\_UTM\_Source - Lookup to Influencer)

---

## Widgets and Buttons

| Button Name    | Module                | Placement               | Functionality                                        |
| -------------- | --------------------- | ----------------------- | ---------------------------------------------------- |
| YT CMT         | Influencers           | Details Page            | Fetches YouTube comments and sends them to Gemini AI |
| GET UTM        | Influencers           | List View (Each Record) | Generates UTM tracking link                          |
| Get Insta Page | Influencers           | Details Page            | Opens Instagram page                                 |
| Get YT Page    | Influencers           | Details Page            | Opens YouTube channel                                |
| AI             | Campaign Intelligence | Details Page            | Displays AI campaign suggestions                     |

---

## CRM Variables

| Variable Name     | API Name                    | Purpose                |
| ----------------- | --------------------------- | ---------------------- |
| YouTube API Key   | finale\_\_youtube\_api\_key | Secure storage for API |
| Gemini AI API Key | finale\_\_gemini\_api\_key  | Secure storage for AI  |

---

## Development Workflow

1. **Module & Field Setup**

   * Created Influencers and Campaign Intelligence modules
   * Added relevant fields for tracking social data and campaign metrics

2. **CRM Variable Configuration**

   * Added API keys as secure CRM variables for access in widgets

3. **Widget Development**

   * Built using Zoho Sigma and React
   * Utilized ZDK SDK for CRM record operations
   * Integrated YouTube API to fetch comments
   * Used Gemini API for sentiment analysis

4. **Button Integration**

   * Connected widgets to buttons in various modules
   * Enabled features such as UTM generation and AI suggestion display

5. **Publishing**

   * Created and published extension privately using marketplace link

---

## Challenges Faced

| Issue                     | Solution                                                    |
| ------------------------- | ----------------------------------------------------------- |
| CRM Variable Not Updating | Re-published extension and cleared cache                    |
| SDK Loading Issues        | Verified script scope and DOM readiness                     |
| Syntax Errors in Build    | Used linting tools and corrected syntax manually            |
| YouTube API Limits        | Ensured valid channel/video ID and handled API quota errors |

---

## Future Enhancements

* Integrate Instagram comment analysis using Instagram Graph API
* Trigger Slack alerts based on sentiment spikes
* Automate lead scoring based on influencer impact
* Generate creative briefs using GPT/Gemini AI

---

## Summary

InfluenceIQ demonstrates how Zoho CRM can be extended into a powerful influencer marketing tool by combining:

* Modular data capture (Influencers, Campaigns, Leads)
* External API integrations (YouTube, Gemini)
* Widgets and automation (UTM links, sentiment analysis)

This document provides a foundation for developers aiming to build CRM extensions that integrate AI and external data sources for business impact.
