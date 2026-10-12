import { db, sqlClient } from './db';
import {
  users,
  organizerProfiles,
  events,
  ticketTypes,
  seats,
  gates,
  eventStaff,
} from './schema';
import {
  UserRole,
  UserStatus,
  OrganizerStatus,
  EventStatus,
  RefundPolicyType,
  SeatStatus,
} from '@tickethub/shared';

async function seed() {
  console.log('Seeding initial database records...');

  // 1. Users
  const [adminUser] = await db
    .insert(users)
    .values({
      email: 'admin@tickethub.vn',
      fullName: 'Quản trị viên Hệ thống',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhashforadminuserpassword123',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  const [organizerUser] = await db
    .insert(users)
    .values({
      email: 'organizer@tickethub.vn',
      fullName: 'Đại diện Ban tổ chức',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhashfororganizerpassword123',
      role: UserRole.ORGANIZER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  const [staffUser] = await db
    .insert(users)
    .values({
      email: 'staff@tickethub.vn',
      fullName: 'Nhân viên Soát vé Cổng',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhashforstaffpassword123',
      role: UserRole.GATE_STAFF,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  const [buyerUser] = await db
    .insert(users)
    .values({
      email: 'buyer@tickethub.vn',
      fullName: 'Nguyễn Văn Người Mua',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhashforbuyerpassword123',
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (!organizerUser) {
    console.log('Seed data already present. Skipping insertion.');
    await sqlClient.end();
    return;
  }

  // 2. Organizer Profile
  const [orgProfile] = await db
    .insert(organizerProfiles)
    .values({
      userId: organizerUser.id,
      organizationName: 'Công ty Cổ phần Âm nhạc và Giải trí Việt Nam',
      taxCode: '0101234567',
      businessLicenseUrl: 'https://cdn.tickethub.vn/licenses/license-0101234567.pdf',
      representativeName: 'Trần Văn Giám Đốc',
      status: OrganizerStatus.VERIFIED,
      verifiedBy: adminUser?.id,
      verifiedAt: new Date(),
    })
    .returning();

  if (!orgProfile) {
    throw new Error('Failed to create organizer profile during seed');
  }

  // 3. Event
  const now = new Date();
  const startTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days later
  const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // +4 hours
  const gateOpeningTime = new Date(startTime.getTime() - 2 * 60 * 60 * 1000); // -2 hours
  const saleStartTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const saleEndTime = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);

  const [sampleEvent] = await db
    .insert(events)
    .values({
      organizerId: orgProfile.id,
      title: 'Liveshow Âm Nhạc Mùa Thu 2026',
      slug: 'liveshow-am-nhac-mua-thu-2026',
      description: 'Đại nhạc hội quy tụ các nghệ sĩ hàng đầu Việt Nam tại Trung tâm Hội nghị Quốc gia.',
      category: 'Âm nhạc',
      bannerUrl: 'https://cdn.tickethub.vn/banners/mua-thu-2026.webp',
      venueName: 'Trung tâm Hội nghị Quốc gia',
      venueAddress: 'Số 57 đường Phạm Hùng, Mễ Trì, Nam Từ Liêm',
      city: 'Hà Nội',
      startTime,
      endTime,
      gateOpeningTime,
      status: EventStatus.PUBLISHED,
      isWaitingRoomEnabled: false,
      maxActiveUsers: 200,
      refundPolicyType: RefundPolicyType.FLEXIBLE,
      refundPolicyRules: [
        { hoursBeforeStart: 72, refundRate: 100 },
        { hoursBeforeStart: 24, refundRate: 50 },
      ],
    })
    .returning();

  if (!sampleEvent) {
    throw new Error('Failed to create event during seed');
  }

  // 4. Ticket Types
  const [vipTicketType] = await db
    .insert(ticketTypes)
    .values({
      eventId: sampleEvent.id,
      name: 'Khu VIP A',
      description: 'Vị trí trực diện sân khấu, lối đi riêng, quà lưu niệm',
      price: '2500000.00',
      capacity: 20,
      isSeated: true,
      saleStartTime,
      saleEndTime,
      maxPerOrder: 6,
      sortOrder: 1,
    })
    .returning();

  if (!vipTicketType) {
    throw new Error('Failed to create VIP ticket type during seed');
  }

  const [standardTicketType] = await db
    .insert(ticketTypes)
    .values({
      eventId: sampleEvent.id,
      name: 'Khu Tiêu Chuẩn B',
      description: 'Ghế ngồi khán đài tầng 1',
      price: '1200000.00',
      capacity: 30,
      isSeated: true,
      saleStartTime,
      saleEndTime,
      maxPerOrder: 6,
      sortOrder: 2,
    })
    .returning();

  const [gaTicketType] = await db
    .insert(ticketTypes)
    .values({
      eventId: sampleEvent.id,
      name: 'Khu Đứng GA',
      description: 'Khu vực đứng gần sân khấu',
      price: '600000.00',
      capacity: 100,
      isSeated: false,
      saleStartTime,
      saleEndTime,
      maxPerOrder: 6,
      sortOrder: 3,
    })
    .returning();

  // 5. Seats for VIP A
  const seatRows = ['A', 'B'];
  const seatRecords = [];
  for (const row of seatRows) {
    for (let i = 1; i <= 10; i++) {
      const seatNumber = i < 10 ? `0${i}` : `${i}`;
      seatRecords.push({
        eventId: sampleEvent.id,
        ticketTypeId: vipTicketType.id,
        zoneName: 'Khu VIP A',
        rowLabel: row,
        seatNumber,
        status: SeatStatus.AVAILABLE,
      });
    }
  }
  await db.insert(seats).values(seatRecords);

  // 6. Gates
  const [gateA] = await db
    .insert(gates)
    .values({
      eventId: sampleEvent.id,
      name: 'Cổng A (VIP)',
      locationDesc: 'Tầng trệt, sảnh chính phía Tây',
    })
    .returning();

  if (!gateA) {
    throw new Error('Failed to create gate A during seed');
  }

  const [gateB] = await db
    .insert(gates)
    .values({
      eventId: sampleEvent.id,
      name: 'Cổng B (Tiêu chuẩn)',
      locationDesc: 'Tầng trệt, sảnh phía Đông',
    })
    .returning();

  // 7. Event Staff
  if (staffUser) {
    await db.insert(eventStaff).values({
      eventId: sampleEvent.id,
      userId: staffUser.id,
      gateId: gateA.id,
      staffRole: 'GATE_SCANNER',
    });
  }

  console.log('Database seeded successfully.');
  await sqlClient.end();
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
