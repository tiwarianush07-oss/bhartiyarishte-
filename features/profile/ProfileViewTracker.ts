
import { trackProfileView } from './profileViews.service';

const SESSION_VIEWS_KEY = 'bhartiya_rishtey_session_views';

class ProfileViewTracker {
    private static getSessionViews(): string[] {
        try {
            const views = sessionStorage.getItem(SESSION_VIEWS_KEY);
            return views ? JSON.parse(views) : [];
        } catch (e) {
            console.error("Failed to parse session views:", e);
            return [];
        }
    }

    private static addViewToSession(targetId: string): void {
        try {
            const views = this.getSessionViews();
            if (!views.includes(targetId)) {
                views.push(targetId);
                sessionStorage.setItem(SESSION_VIEWS_KEY, JSON.stringify(views));
            }
        } catch(e) {
            console.error("Failed to add view to session storage:", e);
        }
    }

    /**
     * Tracks a profile view if it hasn't been tracked in the current session.
     * This method orchestrates the client-side session check and the server-side insertion.
     * @param viewerId The user_id of the user viewing the profile.
     * @param targetId The user_id of the profile being viewed.
     */
    public static async trackView(viewerId: string, targetId: string): Promise<void> {
        if (!viewerId || !targetId || viewerId === targetId) {
            return;
        }

        const sessionViews = this.getSessionViews();
        if (sessionViews.includes(targetId)) {
            return;
        }

        const { success } = await trackProfileView(viewerId, targetId);

        if (success) {
            this.addViewToSession(targetId);
        }
    }
}

export default ProfileViewTracker;
