import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const incomeCategories = ['Gaji', 'Freelance', 'Investasi', 'Lainnya']
const expenseCategories = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Lainnya']

const incomeDescriptions: Record<string, string[]> = {
  Gaji: ['Gaji Bulanan', 'Bonus Tahunan', 'THR', 'Lembur'],
  Freelance: ['Proyek Website', 'Desain Logo', 'Konsultasi IT', 'Penulisan Artikel'],
  Investasi: ['Dividen Saham', 'Bunga Deposito', 'Keuntungan Reksadana'],
  Lainnya: ['Cashback Belanja', 'Hadiah', 'Refund'],
}

const expenseDescriptions: Record<string, string[]> = {
  Makanan: ['Makan Siang', 'Makan Malam', 'Kopi & Snack', 'Grocery', 'Beli Buah', 'Pesanan GoFood'],
  Transportasi: ['Grab/Gojek', 'Bensin', 'Parkir', 'Tol', 'Servis Kendaraan', 'Top Up GoPay'],
  Belanja: ['Baju Online', 'Sepatu', 'Peralatan Rumah', 'Elektronik', 'Skincare'],
  Hiburan: ['Netflix', 'Spotify', 'Bioskop', 'Game Steam', 'Konser Musik', 'Buku'],
  Tagihan: ['Listrik', 'Internet', 'Air PDAM', 'BPJS', 'Cicilan KPR', 'Telepon'],
  Kesehatan: ['Obat-obatan', 'Vitamin', 'Cek Kesehatan', 'Gym Membership', 'Dokter Gigi'],
  Pendidikan: ['Kursus Online', 'Buku Teknis', 'Udemy Course', 'Seminar'],
  Lainnya: ['Donasi', 'Gift', 'Biaya Tak Terduga', 'Asuransi'],
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  // Clear existing
  await db.transaction.deleteMany()

  const transactions = []
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Generate ~100 transactions over 6 months
  for (let i = 0; i < 100; i++) {
    const isIncome = Math.random() < 0.3 // 30% income, 70% expense
    const type = isIncome ? 'income' : 'expense'
    const category = isIncome
      ? randomItem(incomeCategories)
      : randomItem(expenseCategories)
    const descriptions = isIncome
      ? incomeDescriptions[category]
      : expenseDescriptions[category]
    const description = randomItem(descriptions)

    let amount: number
    if (isIncome) {
      if (category === 'Gaji') {
        amount = randomAmount(7000000, 15000000)
      } else if (category === 'Freelance') {
        amount = randomAmount(500000, 5000000)
      } else if (category === 'Investasi') {
        amount = randomAmount(100000, 2000000)
      } else {
        amount = randomAmount(10000, 200000)
      }
    } else {
      if (category === 'Tagihan') {
        amount = randomAmount(200000, 3000000)
      } else if (category === 'Belanja') {
        amount = randomAmount(50000, 2000000)
      } else if (category === 'Makanan') {
        amount = randomAmount(15000, 500000)
      } else if (category === 'Hiburan') {
        amount = randomAmount(30000, 500000)
      } else if (category === 'Kesehatan') {
        amount = randomAmount(50000, 1000000)
      } else {
        amount = randomAmount(10000, 500000)
      }
    }

    const date = randomDate(sixMonthsAgo, now)
    date.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60))

    transactions.push({
      type,
      amount,
      category,
      description,
      date,
    })
  }

  // Sort by date descending
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime())

  for (const t of transactions) {
    await db.transaction.create({ data: t })
  }

  console.log(`Seeded ${transactions.length} transactions`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
