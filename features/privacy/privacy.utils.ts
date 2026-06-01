
type PhotoVisibility = 'public' | 'members_only' | 'premium_only' | 'request_required';
type ContactVisibility = 'hidden' | 'interest_only' | 'premium_only';
type InterestStatus = 'pending' | 'accepted' | 'rejected' | undefined;

interface CanViewPhotosParams {
  viewerId: string | null;
  photoVisibility: PhotoVisibility;
  isPremium: boolean;
  interestStatus: InterestStatus;
}

/**
 * Determines if the current user can view the photos of a target profile.
 * This is a pure function and relies on the caller to provide correct state.
 */
export const canViewPhotos = ({
  viewerId,
  photoVisibility,
  isPremium,
  interestStatus,
}: CanViewPhotosParams): boolean => {
  switch (photoVisibility) {
    case 'public':
      return true;
    case 'members_only':
      return !!viewerId; // True if viewerId is not null (i.e., user is authenticated)
    case 'premium_only':
      return isPremium;
    case 'request_required':
      return interestStatus === 'accepted';
    default:
      return false;
  }
};

interface CanViewContactParams {
  contactVisibility: ContactVisibility;
  isPremium: boolean;
  interestStatus: InterestStatus;
}

/**
 * Determines if the current user can view the contact details of a target profile.
 * This is a pure function and relies on the caller to provide correct state.
 */
export const canViewContact = ({
  contactVisibility,
  isPremium,
  interestStatus,
}: CanViewContactParams): boolean => {
  switch (contactVisibility) {
    case 'hidden':
      return false;
    case 'interest_only':
      return interestStatus === 'accepted';
    case 'premium_only':
      return isPremium;
    default:
      return false;
  }
};
