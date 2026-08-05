import type { Student, Heat } from '../types/olympics';

export function createPreescolarSimulationData(): { students: Student[]; heats: Heat[] } {
  const now = Date.now();

  const students: Student[] = [
    // 1º A Varonil (Equipo 1)
    { id: 'st_1a_1', firstName: 'Liam Santiago', lastName: 'Aguilar Castellanos', gradeGroup: '1º A', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 24000 },
    { id: 'st_1a_2', firstName: 'Ian Gael', lastName: 'Vázquez Mendoza', gradeGroup: '1º A', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 23000 },
    { id: 'st_1a_3', firstName: 'Dylan Emiliano', lastName: 'Orozco Ramírez', gradeGroup: '1º A', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 22000 },
    { id: 'st_1a_4', firstName: 'Bruno Alexander', lastName: 'Cabrera Santos', gradeGroup: '1º A', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 21000 },

    // 1º B Varonil (Equipo 2)
    { id: 'st_1b_1', firstName: 'Mateo Alejandro', lastName: 'Morales Ruiz', gradeGroup: '1º B', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 20000 },
    { id: 'st_1b_2', firstName: 'Thiago Valentín', lastName: 'Cruz López', gradeGroup: '1º B', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 19000 },
    { id: 'st_1b_3', firstName: 'Matías Nicolás', lastName: 'Espinosa Valenzuela', gradeGroup: '1º B', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 18000 },
    { id: 'st_1b_4', firstName: 'Samuel David', lastName: 'Rojas Morales', gradeGroup: '1º B', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 17000 },

    // 1º C Varonil (Equipo 3)
    { id: 'st_1c_1', firstName: 'Lucas Benjamín', lastName: 'Coutiño Serrano', gradeGroup: '1º C', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 16000 },
    { id: 'st_1c_2', firstName: 'Sebastián Omar', lastName: 'Velasco Cancino', gradeGroup: '1º C', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 15000 },
    { id: 'st_1c_3', firstName: 'Gabriel Agustín', lastName: 'Trejo Ballinas', gradeGroup: '1º C', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 14000 },
    { id: 'st_1c_4', firstName: 'Emiliano Isaí', lastName: 'Pinto Zenteno', gradeGroup: '1º C', gender: 'boy', events: ['relevos', 'velocidad'], createdAt: now - 13000 },

    // 1º A Femenil (Equipo 1 Femenil)
    { id: 'st_1a_g1', firstName: 'Victoria Guadalupe', lastName: 'Moreno Solís', gradeGroup: '1º A', gender: 'girl', events: ['relevos', 'vallas'], createdAt: now - 12000 },
    { id: 'st_1a_g2', firstName: 'Renata Lucía', lastName: 'Jiménez Flores', gradeGroup: '1º A', gender: 'girl', events: ['relevos', 'vallas'], createdAt: now - 11000 },
    { id: 'st_1a_g3', firstName: 'Camila Fernanda', lastName: 'Estrada Gutiérrez', gradeGroup: '1º A', gender: 'girl', events: ['relevos', 'vallas'], createdAt: now - 10000 },
    { id: 'st_1a_g4', firstName: 'Mia Valentina', lastName: 'Toledo Albores', gradeGroup: '1º A', gender: 'girl', events: ['relevos', 'vallas'], createdAt: now - 9000 },

    // 1º B Femenil (Equipo 2 Femenil)
    { id: 'st_1b_g1', firstName: 'Sofía Isabel', lastName: 'Gómez Hernández', gradeGroup: '1º B', gender: 'girl', events: ['relevos', 'vallas'], createdAt: now - 8500 },
    { id: 'st_1b_g2', firstName: 'Emma Regina', lastName: 'Pérez Domínguez', gradeGroup: '1º B', gender: 'girl', events: ['relevos', 'vallas'], createdAt: now - 8400 },
    { id: 'st_1b_g3', firstName: 'Isabella Monserrat', lastName: 'Marín Calvo', gradeGroup: '1º B', gender: 'girl', events: ['relevos', 'vallas'], createdAt: now - 8300 },
    { id: 'st_1b_g4', firstName: 'Luciana Nicole', lastName: 'Trujillo Guillén', gradeGroup: '1º B', gender: 'girl', events: ['relevos', 'vallas'], createdAt: now - 8200 },

    // 2º A Niños (Velocidad)
    { id: 'st_2a_1', firstName: 'Leonardo', lastName: 'Bermúdez Burgos', gradeGroup: '2º A', gender: 'boy', events: ['velocidad', 'vallas'], createdAt: now - 8000 },
    { id: 'st_2a_2', firstName: 'Iker Oswaldo', lastName: 'Hernández Collí', gradeGroup: '2º A', gender: 'boy', events: ['velocidad', 'vallas'], createdAt: now - 7000 },
    { id: 'st_2a_3', firstName: 'Jesús Miguel', lastName: 'Tipacamú Gómez', gradeGroup: '2º A', gender: 'boy', events: ['velocidad', 'vallas'], createdAt: now - 6000 },
    { id: 'st_2a_4', firstName: 'Emiliano', lastName: 'Zepeda Gómez', gradeGroup: '2º A', gender: 'boy', events: ['velocidad', 'vallas'], createdAt: now - 5000 },

    // 3º A Niñas (Lanzamiento de Bala)
    { id: 'st_3a_1', firstName: 'Altair Sophia', lastName: 'Alemán García', gradeGroup: '3º A', gender: 'girl', events: ['bala'], createdAt: now - 4000 },
    { id: 'st_3a_2', firstName: 'Erika', lastName: 'Máximo López', gradeGroup: '3º A', gender: 'girl', events: ['bala'], createdAt: now - 3000 },
    { id: 'st_3a_3', firstName: 'María José', lastName: 'Ordóñez Nucamendi', gradeGroup: '3º A', gender: 'girl', events: ['bala'], createdAt: now - 2000 },
    { id: 'st_3a_4', firstName: 'Romina Elizabeth', lastName: 'Gordillo Solórzano', gradeGroup: '3º A', gender: 'girl', events: ['bala'], createdAt: now - 1000 }
  ];

  const heats: Heat[] = [
    // 🔴 HIT #1: RELEVOS 1º GRADO VARONIL (Un solo Hit con los 3 equipos compitiendo simultáneamente)
    {
      id: 'h_sim_1',
      number: 1,
      gradeGroup: '1º',
      gender: 'boy',
      eventId: 'relevos',
      studentIds: [
        'st_1a_1', 'st_1a_2', 'st_1a_3', 'st_1a_4',
        'st_1b_1', 'st_1b_2', 'st_1b_3', 'st_1b_4',
        'st_1c_1', 'st_1c_2', 'st_1c_3', 'st_1c_4'
      ],
      status: 'live',
      createdAt: now - 20000
    },

    // HIT #2: RELEVOS 1º GRADO FEMENIL (Un solo Hit con los 2 equipos femeniles)
    {
      id: 'h_sim_2',
      number: 2,
      gradeGroup: '1º',
      gender: 'girl',
      eventId: 'relevos',
      studentIds: [
        'st_1a_g1', 'st_1a_g2', 'st_1a_g3', 'st_1a_g4',
        'st_1b_g1', 'st_1b_g2', 'st_1b_g3', 'st_1b_g4'
      ],
      status: 'pending',
      createdAt: now - 18000
    },

    // HIT #3: VELOCIDAD 2º GRADO VARONIL
    {
      id: 'h_sim_3',
      number: 1,
      gradeGroup: '2º A',
      gender: 'boy',
      eventId: 'velocidad',
      studentIds: ['st_2a_1', 'st_2a_2', 'st_2a_3', 'st_2a_4'],
      status: 'pending',
      createdAt: now - 17000
    },

    // HIT #4: VALLAS 1º GRADO FEMENIL
    {
      id: 'h_sim_4',
      number: 1,
      gradeGroup: '1º A',
      gender: 'girl',
      eventId: 'vallas',
      studentIds: ['st_1a_g1', 'st_1a_g2', 'st_1a_g3', 'st_1a_g4'],
      status: 'pending',
      createdAt: now - 16000
    },

    // HIT #5: LANZAMIENTO DE BALA 3º GRADO FEMENIL
    {
      id: 'h_sim_5',
      number: 1,
      gradeGroup: '3º A',
      gender: 'girl',
      eventId: 'bala',
      studentIds: ['st_3a_1', 'st_3a_2', 'st_3a_3', 'st_3a_4'],
      status: 'pending',
      createdAt: now - 15000
    }
  ];

  return { students, heats };
}
