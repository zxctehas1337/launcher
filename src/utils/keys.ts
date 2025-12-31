// API functions for license keys
export const getLicenseKeys = async () => {
  try {
    const response = await fetch('/api/keys');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return { success: false, message: 'Failed to fetch keys' };
  } catch (error) {
    console.error('Error fetching license keys:', error);
    return { success: false, message: 'Network error' };
  }
};

export const createLicenseKeys = async (keys: any[]) => {
  try {
    const response = await fetch('/api/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keys }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return { success: false, message: 'Failed to create keys' };
  } catch (error) {
    console.error('Error creating license keys:', error);
    return { success: false, message: 'Network error' };
  }
};

export const activateLicenseKey = async (key: string, userId: string) => {
  try {
    const response = await fetch('/api/keys/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, userId }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    const errorData = await response.json();
    return errorData;
  } catch (error) {
    console.error('Error activating license key:', error);
    return { success: false, message: 'Network error' };
  }
};

export const deleteLicenseKey = async (keyId: string) => {
  try {
    const response = await fetch(`/api/keys/${keyId}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return { success: false, message: 'Failed to delete key' };
  } catch (error) {
    console.error('Error deleting license key:', error);
    return { success: false, message: 'Network error' };
  }
};
