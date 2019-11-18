import { Factory } from 'rosie'
import Faker from 'faker'
import { ISO0100, ISO0110 } from '../../src/types/iso-messages'

function pad (value: string, length: number, char: string) {
  if (value.length >= length) {
    return value.substring(0, length)
  }

  const diff = length - value.length
  let padding = ''

  for (let i = 0; i < diff; i++) {
    padding += char
  }

  return padding + value
}

function generateField7 (): string {
  const now = new Date(Date.now())
  const month = (now.getUTCMonth() + 1).toString()
  const day = now.getUTCDate().toString()
  const minutes = now.getUTCMinutes().toString()
  const hours = now.getUTCHours().toString()
  const seconds = now.getUTCSeconds().toString()

  return pad(month, 2, '0') + pad(day, 2, '0') + pad(hours, 2, '0') + pad(minutes, 2, '0') + pad(seconds, 2, '0')
}

export const ISO0100Factory = Factory.define<Partial<ISO0100>>('Iso0100Factory').attrs({
  3: '012000',
  4: '000000010000',
  49: '820',
  7: generateField7(),
  37: Faker.internet.password(12, false, /[0-9a-z]/),
  41: Faker.internet.password(8, false, /[0-9a-z]/),
  42: Faker.internet.password(15, false, /[0-9a-z]/),
  102: () => '26' + Faker.internet.password(26, false, /[0-9]/),
  28: 'C00000001',
  103: () => '04' + Faker.internet.password(6, false, /[0-9]/),
  11: Faker.internet.password(6, false, /[0-9]/)
})

export const ISO0110Factory = Factory.define<Partial<ISO0110>>('Iso0110Factory').attrs({
  0: '0110',
  3: '012000',
  7: generateField7(),
  11: Faker.internet.password(6, false, /[0-9]/),
  28: 'C00000001',
  30: 'C00000001',
  39: '00',
  41: Faker.internet.password(8, false, /[0-9a-z]/),
  42: Faker.internet.password(15, false, /[0-9a-z]/),
  48: '012000',
  49: '840',
  102: () => '26' + Faker.internet.password(26, false, /[0-9]/)
})

export const iso0100BinaryMessage = Buffer.from([0x01,0x46,0x30,0x31,0x30,0x30,0xf2,0x3e,0x44,0x94,0x09,0xe0,0x81,
  0x20,0x00,0x00,0x00,0x00,0x10,0x00,0x00,0x22,0x31,0x36,0x35,0x39,0x35,0x39,0x35,0x39,0x30,0x30,0x30,0x30,0x30,0x30,
  0x30,0x30,0x34,0x32,0x32,0x31,0x31,0x30,0x31,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x31,0x30,0x30,0x30,0x30,0x30,0x30,
  0x33,0x32,0x38,0x31,0x32,0x34,0x38,0x34,0x35,0x34,0x35,0x36,0x37,0x38,0x31,0x31,0x32,0x34,0x38,0x34,0x35,0x30,0x33,
  0x32,0x38,0x32,0x30,0x30,0x33,0x30,0x33,0x32,0x38,0x30,0x37,0x38,0x30,0x30,0x30,0x30,0x30,0x30,0x43,0x30,0x30,0x30,
  0x30,0x30,0x30,0x30,0x30,0x43,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,
  0x30,0x31,0x30,0x30,0x30,0x30,0x20,0x75,0x6a,0x64,0x75,0x35,0x35,0x38,0x31,0x32,0x33,0x34,0x35,0x30,0x30,0x30,0x30,
  0x30,0x36,0x37,0x38,0x39,0x30,0x6b,0x6f,0x72,0x61,0x74,0x74,0x79,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,
  0x20,0x20,0x20,0x20,0x20,0x20,0x74,0x68,0x72,0x69,0x73,0x73,0x75,0x72,0x20,0x20,0x20,0x20,0x20,0x6b,0x65,0x49,0x4e,
  0x33,0x35,0x36,0x30,0x30,0x34,0x31,0x35,0x31,0x30,0x30,0x31,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x31,0x30,
  0x30,0x36,0x34,0x38,0x34,0x38,0x34,0x38,0x30,0x31,0x35,0x30,0x30,0x30,0x30,0x31,0x31,0x30,0x30,0x30,0x30,0x31,0x30,
  0x30,0x30,0x31,0x30,0x30,0x30,0x30,0x37,0x36,0x60,0x00,0x10,0x00,0x00,0x00,0x00,0x00,0x31,0x30,0x30,0x30,0x30,0x30,
  0x30,0x30,0x30,0x30,0x31,0x30,0x53,0x72,0x63,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x6e,0x65,0x77,0x53,0x69,
  0x6e,0x6b,0x20,0x20,0x20,0x20,0x20,0x34,0x35,0x36,0x37,0x38,0x31,0x34,0x35,0x36,0x37,0x38,0x31,0x44,0x65,0x62,0x69,
  0x74,0x47,0x72,0x6f,0x75,0x70,0x20,0x20,0x32,0x30,0x31,0x38,0x30,0x33,0x32,0x38])
