import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { Friend, InviteCodeResponse, AcceptInviteResponse } from '@/api/friends';

// Device ID 생성 또는 가져오기
export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'ggumul_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}

// Firestore 컬렉션 참조
const COLLECTIONS = {
  DEVICES: 'devices',
  FRIENDSHIPS: 'friendships',
  INVITE_CODES: 'invite_codes',
};

/**
 * 내 디바이스 정보 저장/업데이트
 */
export async function syncMyDevice() {
  if (!isFirebaseConfigured() || !db) return;

  const deviceId = getOrCreateDeviceId();
  const nickname = localStorage.getItem('ggumul_nickname');

  await setDoc(
    doc(db, COLLECTIONS.DEVICES, deviceId),
    {
      device_id: deviceId,
      nickname: nickname || null,
      last_active: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * 초대 코드 생성
 */
export async function createInviteCode(): Promise<InviteCodeResponse> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  await syncMyDevice();

  const deviceId = getOrCreateDeviceId();
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후

  await setDoc(doc(db, COLLECTIONS.INVITE_CODES, code), {
    code,
    device_id: deviceId,
    expires_at: Timestamp.fromDate(expiresAt),
    created_at: serverTimestamp(),
  });

  return {
    code,
    expires_at: expiresAt.toISOString(),
    share_url: `${window.location.origin}/#/friends?code=${code}`,
  };
}

/**
 * 초대 코드 수락
 */
export async function acceptInviteCode(code: string): Promise<AcceptInviteResponse> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  await syncMyDevice();

  const myDeviceId = getOrCreateDeviceId();

  // 초대 코드 확인
  const inviteDoc = await getDoc(doc(db, COLLECTIONS.INVITE_CODES, code));

  if (!inviteDoc.exists()) {
    throw new Error('유효하지 않은 초대 코드입니다.');
  }

  const inviteData = inviteDoc.data();
  const friendDeviceId = inviteData.device_id;

  // 만료 확인
  const expiresAt = inviteData.expires_at.toDate();
  if (expiresAt < new Date()) {
    throw new Error('만료된 초대 코드입니다.');
  }

  // 자기 자신 추가 방지
  if (friendDeviceId === myDeviceId) {
    throw new Error('자신을 친구로 추가할 수 없습니다.');
  }

  // 이미 친구인지 확인
  const existingFriendship = await getDoc(
    doc(db, COLLECTIONS.FRIENDSHIPS, `${myDeviceId}_${friendDeviceId}`)
  );

  if (existingFriendship.exists()) {
    throw new Error('이미 친구입니다.');
  }

  // 양방향 친구 관계 생성
  const timestamp = serverTimestamp();

  await Promise.all([
    setDoc(doc(db, COLLECTIONS.FRIENDSHIPS, `${myDeviceId}_${friendDeviceId}`), {
      device_id: myDeviceId,
      friend_device_id: friendDeviceId,
      created_at: timestamp,
    }),
    setDoc(doc(db, COLLECTIONS.FRIENDSHIPS, `${friendDeviceId}_${myDeviceId}`), {
      device_id: friendDeviceId,
      friend_device_id: myDeviceId,
      created_at: timestamp,
    }),
  ]);

  return {
    success: true,
    friend_device_id: friendDeviceId,
    message: '친구가 추가되었습니다!',
  };
}

/**
 * 친구 목록 조회
 */
export async function getFriends(): Promise<Friend[]> {
  if (!isFirebaseConfigured() || !db) {
    console.log('[firebaseFriends] Firebase가 설정되지 않아 빈 친구 목록 반환');
    return [];
  }

  try {
    await syncMyDevice();
  } catch (err) {
    console.error('[firebaseFriends] syncMyDevice 실패:', err);
    return [];
  }

  const myDeviceId = getOrCreateDeviceId();

  // 내 친구 관계 조회
  const q = query(
    collection(db, COLLECTIONS.FRIENDSHIPS),
    where('device_id', '==', myDeviceId)
  );

  const querySnapshot = await getDocs(q);
  const friendDeviceIds = querySnapshot.docs.map((doc) => doc.data().friend_device_id);

  if (friendDeviceIds.length === 0) {
    return [];
  }

  // 친구들의 디바이스 정보 조회
  const friendsData: Friend[] = [];

  for (const friendDeviceId of friendDeviceIds) {
    const deviceDoc = await getDoc(doc(db, COLLECTIONS.DEVICES, friendDeviceId));

    if (deviceDoc.exists()) {
      const data = deviceDoc.data();
      friendsData.push({
        device_id: friendDeviceId,
        nickname: data.nickname || null,
        today_success: false, // TODO: 실제 통계 연동
        current_streak: 0,
        success_rate: 0,
        created_at: data.last_active?.toDate().toISOString() || new Date().toISOString(),
      });
    }
  }

  return friendsData;
}

/**
 * 친구 삭제
 */
export async function removeFriend(friendDeviceId: string): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  const myDeviceId = getOrCreateDeviceId();

  // 양방향 친구 관계 삭제
  await Promise.all([
    deleteDoc(doc(db, COLLECTIONS.FRIENDSHIPS, `${myDeviceId}_${friendDeviceId}`)),
    deleteDoc(doc(db, COLLECTIONS.FRIENDSHIPS, `${friendDeviceId}_${myDeviceId}`)),
  ]);

  return {
    success: true,
    message: '친구가 삭제되었습니다.',
  };
}
