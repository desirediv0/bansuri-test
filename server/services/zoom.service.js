import axios from "axios";
import { ApiError } from "../utils/ApiError.js";

// Function to get Zoom access token
export const getZoomAccessToken = async () => {
    try {
        const accountId = process.env.ZOOM_ACCOUNT_ID;
        const clientId = process.env.ZOOM_CLIENT_ID;
        const clientSecret = process.env.ZOOM_CLIENT_SECRET;

        const authBuffer = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await axios.post(
            'https://zoom.us/oauth/token',
            new URLSearchParams({
                grant_type: 'account_credentials',
                account_id: accountId
            }),
            {
                headers: {
                    'Authorization': `Basic ${authBuffer}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return response.data.access_token;
    } catch (error) {
        console.error("Error getting Zoom access token:", error.response?.data || error.message);
        throw new ApiError(500, "Failed to get Zoom access token");
    }
};

// Create a Zoom meeting
export const createZoomMeeting = async (meetingData) => {
    try {
        const token = await getZoomAccessToken();

        const response = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: meetingData.title,
                type: 2,
                start_time: meetingData.startTime.toISOString(),
                duration: Math.ceil((new Date(meetingData.endTime) - new Date(meetingData.startTime)) / (60 * 1000)),
                timezone: 'Asia/Kolkata',
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: true
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            zoomMeetingId: response.data.id,
            zoomLink: response.data.join_url,
            zoomPassword: response.data.password
        };
    } catch (error) {
        console.error("Error creating Zoom meeting:", error.response?.data || error.message);
        throw new ApiError(500, "Failed to create Zoom meeting");
    }
};

// Update a Zoom meeting
export const updateZoomMeeting = async (meetingId, meetingData) => {
    try {
        const token = await getZoomAccessToken();

        const response = await axios.patch(
            `https://api.zoom.us/v2/meetings/${meetingId}`,
            {
                topic: meetingData.title,
                start_time: meetingData.startTime.toISOString(),
                duration: Math.ceil((new Date(meetingData.endTime) - new Date(meetingData.startTime)) / (60 * 1000)),
                timezone: 'Asia/Kolkata'
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true
        };
    } catch (error) {
        console.error("Error updating Zoom meeting:", error.response?.data || error.message);
        throw new ApiError(500, "Failed to update Zoom meeting");
    }
};

// Delete a Zoom meeting
export const deleteZoomMeeting = async (meetingId) => {
    try {
        const token = await getZoomAccessToken();

        await axios.delete(
            `https://api.zoom.us/v2/meetings/${meetingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true
        };
    } catch (error) {
        console.error("Error deleting Zoom meeting:", error.response?.data || error.message);
        throw new ApiError(500, "Failed to delete Zoom meeting");
    }
};

// Get meeting details
export const getZoomMeetingDetails = async (meetingId) => {
    try {
        const token = await getZoomAccessToken();

        const response = await axios.get(
            `https://api.zoom.us/v2/meetings/${meetingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error getting Zoom meeting details:", error.response?.data || error.message);
        throw new ApiError(500, "Failed to get Zoom meeting details");
    }
};
