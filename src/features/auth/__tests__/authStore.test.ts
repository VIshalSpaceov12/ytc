import { useAuthStore } from '../authStore';
describe('authStore', () => {
  beforeEach(() => useAuthStore.setState({ session: null, status: 'loading' }));
  it('starts loading', () => { expect(useAuthStore.getState().status).toBe('loading'); });
  it('signed-out when null after init', () => {
    useAuthStore.getState().setSession(null);
    expect(useAuthStore.getState().status).toBe('signed-out');
  });
  it('signed-in when session', () => {
    useAuthStore.getState().setSession({ user: { id: 'u1' } } as any);
    expect(useAuthStore.getState().status).toBe('signed-in');
    expect(useAuthStore.getState().userId).toBe('u1');
  });
});
