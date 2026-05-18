import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/church'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear existing data
  await prisma.attendance.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.member.deleteMany()
  await prisma.family.deleteMany()

  // Helper to create a family with members
  async function createFamily(familyName: string, members: { firstName: string; lastName: string; status?: string }[]) {
    const family = await prisma.family.create({
      data: { name: familyName },
    })
    for (const member of members) {
      await prisma.member.create({
        data: {
          firstName: member.firstName,
          lastName: member.lastName,
          status: member.status || 'member',
          familyId: family.id,
        },
      })
    }
    return family
  }

  // Helper to create a solo member with their own family
  async function createSoloMember(firstName: string, lastName: string, status = 'member') {
    const family = await prisma.family.create({
      data: { name: lastName },
    })
    await prisma.member.create({
      data: { firstName, lastName, status, familyId: family.id },
    })
  }

  // 1. Ramirez/Torres family (large family)
  await createFamily('Ramirez', [
    { firstName: 'Eduardo', lastName: 'Ramirez Lopez' },
    { firstName: 'Carmen', lastName: 'Torres Vega' },
    { firstName: 'Luis A.', lastName: 'Ramirez Torres' },
    { firstName: 'Sofia', lastName: 'Ramirez Torres' },
    { firstName: 'Daniela', lastName: 'Ramirez Torres' },
  ])

  // 2. Gonzalez/Rivera family
  await createFamily('Gonzalez', [
    { firstName: 'Miguel', lastName: 'Gonzalez Ruiz' },
    { firstName: 'Ana', lastName: 'Rivera Colon' },
    { firstName: 'Gabriel', lastName: 'Gonzalez Rivera' },
  ])

  // 3. Herrera family
  await createFamily('Herrera', [
    { firstName: 'Jorge', lastName: 'Herrera Santana' },
    { firstName: 'Lucia', lastName: 'Herrera Mendez' },
  ])

  // 4. Santos/Vargas family
  await createFamily('Santos', [
    { firstName: 'Ricardo', lastName: 'Santos Ocasio' },
    { firstName: 'Patricia', lastName: 'Vargas Nieves' },
    { firstName: 'Alejandro', lastName: 'Santos Vargas' },
    { firstName: 'Valeria', lastName: 'Santos Vargas' },
  ])

  // 5. Mendoza solo
  await createSoloMember('Rosa', 'Mendoza')

  // 6. Delgado/Ortiz family
  await createFamily('Delgado', [
    { firstName: 'Fernando', lastName: 'Delgado Cruz' },
    { firstName: 'Isabel', lastName: 'Ortiz Marrero' },
  ])

  // 7. Navarro solo
  await createSoloMember('Hector', 'Navarro')

  // 8. Figueroa/Acosta family
  await createFamily('Figueroa', [
    { firstName: 'David', lastName: 'Figueroa Ramos' },
    { firstName: 'Marta', lastName: 'Acosta Diaz' },
    { firstName: 'Samuel', lastName: 'Figueroa Acosta' },
  ])

  // 9. Moreno solo (visitor)
  await createSoloMember('Andrea', 'Moreno', 'visitor')

  // 10. Castillo/Rojas family
  await createFamily('Castillo', [
    { firstName: 'Oscar', lastName: 'Castillo Velez' },
    { firstName: 'Beatriz', lastName: 'Rojas Santiago' },
  ])

  // 11. Pena solo
  await createSoloMember('Victor', 'Pena')

  // 12. Soto/Medina family (large family)
  await createFamily('Soto', [
    { firstName: 'Andres', lastName: 'Soto Maldonado' },
    { firstName: 'Yolanda', lastName: 'Medina Colon' },
    { firstName: 'Marcos', lastName: 'Soto Medina' },
    { firstName: 'Camila', lastName: 'Soto Medina' },
  ])

  // 13. Villanueva solo (visitor)
  await createSoloMember('Roberto', 'Villanueva', 'visitor')

  // 14. Aguirre solo
  await createSoloMember('Graciela', 'Aguirre')

  // 15. Salazar/Reyes family
  await createFamily('Salazar', [
    { firstName: 'Enrique', lastName: 'Salazar Aponte' },
    { firstName: 'Natalia', lastName: 'Reyes Lugo' },
    { firstName: 'Emilio', lastName: 'Salazar Reyes' },
  ])

  // 16. Ibarra solo (members_class)
  await createSoloMember('Javier', 'Ibarra', 'members_class')

  // 17. Guerrero/Pacheco family
  await createFamily('Guerrero', [
    { firstName: 'Raul', lastName: 'Guerrero Flores' },
    { firstName: 'Elena', lastName: 'Pacheco Serrano' },
  ])

  // 18. Contreras solo
  await createSoloMember('Adriana', 'Contreras')

  // 19. Cabrera solo (inactive)
  await createSoloMember('Francisco', 'Cabrera', 'inactive')

  // 20. Espinoza/Leon family
  await createFamily('Espinoza', [
    { firstName: 'Manuel', lastName: 'Espinoza Vega' },
    { firstName: 'Diana', lastName: 'Leon Carrasquillo' },
    { firstName: 'Isabella', lastName: 'Espinoza Leon' },
  ])

  // 21. Rios solo (visitor)
  await createSoloMember('Alicia', 'Rios', 'visitor')

  // 22. Cardenas solo
  await createSoloMember('Pablo', 'Cardenas')

  // 23. Dominguez/Fuentes family
  await createFamily('Dominguez', [
    { firstName: 'Alberto', lastName: 'Dominguez Correa' },
    { firstName: 'Mariana', lastName: 'Fuentes Otero' },
  ])

  // 24. Avila solo (members_class)
  await createSoloMember('Lorena', 'Avila', 'members_class')

  // 25. Paredes solo
  await createSoloMember('Sergio', 'Paredes')

  // 26. Nunez/Sandoval family
  await createFamily('Nunez', [
    { firstName: 'Ernesto', lastName: 'Nunez Baez' },
    { firstName: 'Gloria', lastName: 'Sandoval Montalvo' },
    { firstName: 'Mateo', lastName: 'Nunez Sandoval' },
    { firstName: 'Nicolas', lastName: 'Nunez Sandoval' },
  ])

  // 27. Zamora solo (inactive)
  await createSoloMember('Ruben', 'Zamora', 'inactive')

  // 28. Lara solo
  await createSoloMember('Teresa', 'Lara')

  // 29. Estrada/Velazquez family
  await createFamily('Estrada', [
    { firstName: 'Gerardo', lastName: 'Estrada Mejia' },
    { firstName: 'Monica', lastName: 'Velazquez Rios' },
  ])

  // 30. Quintero solo (visitor)
  await createSoloMember('Julian', 'Quintero', 'visitor')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
