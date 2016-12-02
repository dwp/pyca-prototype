'use strict';

// Country list
var list = [
  {
    name: 'Afghanistan',
    EEA: false
  },
  {
    name: 'Albania',
    EEA: false
  },
  {
    name: 'Algeria',
    EEA: false
  },
  {
    name: 'Andorra',
    EEA: false
  },
  {
    name: 'Angola',
    EEA: false
  },
  {
    name: 'Anguilla',
    EEA: false
  },
  {
    name: 'Antigua & Barbuda',
    EEA: false
  },
  {
    name: 'Argentina',
    EEA: false
  },
  {
    name: 'Armenia',
    EEA: false
  },
  {
    name: 'Aruba',
    EEA: false
  },
  {
    name: 'Australia',
    EEA: false
  },
  {
    name: 'Austria',
    EEA: true
  },
  {
    name: 'Azerbaijan',
    EEA: false
  },
  {
    name: 'Bahamas',
    EEA: false
  },
  {
    name: 'Bahrain',
    EEA: false
  },
  {
    name: 'Bangladesh',
    EEA: false
  },
  {
    name: 'Barbados',
    EEA: false
  },
  {
    name: 'Belarus',
    EEA: false
  },
  {
    name: 'Belgium',
    EEA: true
  },
  {
    name: 'Belize',
    EEA: false
  },
  {
    name: 'Benin',
    EEA: false
  },
  {
    name: 'Bermuda',
    EEA: false
  },
  {
    name: 'Bhutan',
    EEA: false
  },
  {
    name: 'Bolivia',
    EEA: false
  },
  {
    name: 'Bosnia & Herzegovina',
    EEA: false
  },
  {
    name: 'Botswana',
    EEA: false
  },
  {
    name: 'Brazil',
    EEA: false
  },
  {
    name: 'British Virgin Islands',
    EEA: false
  },
  {
    name: 'Brunei',
    EEA: false
  },
  {
    name: 'Bulgaria',
    EEA: true
  },
  {
    name: 'Burkina Faso',
    EEA: false
  },
  {
    name: 'Burundi',
    EEA: false
  },
  {
    name: 'Cambodia',
    EEA: false
  },
  {
    name: 'Cameroon',
    EEA: false
  },
  {
    name: 'Cape Verde',
    EEA: false
  },
  {
    name: 'Cayman Islands',
    EEA: false
  },
  {
    name: 'Chad',
    EEA: false
  },
  {
    name: 'Chile',
    EEA: false
  },
  {
    name: 'China',
    EEA: false
  },
  {
    name: 'Colombia',
    EEA: false
  },
  {
    name: 'Congo',
    EEA: false
  },
  {
    name: 'Cook Islands',
    EEA: false
  },
  {
    name: 'Costa Rica',
    EEA: false
  },
  {
    name: 'Cote D Ivoire',
    EEA: false
  },
  {
    name: 'Croatia',
    EEA: true
  },
  {
    name: 'Cuba',
    EEA: false
  },
  {
    name: 'Czech Republic',
    EEA: true
  },
  {
    name: 'Denmark',
    EEA: true
  },
  {
    name: 'Djibouti',
    EEA: false
  },
  {
    name: 'Dominica',
    EEA: false
  },
  {
    name: 'Dominican Republic',
    EEA: false
  },
  {
    name: 'Ecuador',
    EEA: false
  },
  {
    name: 'Egypt',
    EEA: false
  },
  {
    name: 'El Salvador',
    EEA: false
  },
  {
    name: 'Equatorial Guinea',
    EEA: false
  },
  {
    name: 'Estonia',
    EEA: true
  },
  {
    name: 'Ethiopia',
    EEA: false
  },
  {
    name: 'Falkland Islands',
    EEA: false
  },
  {
    name: 'Faroe Islands',
    EEA: false
  },
  {
    name: 'Fiji',
    EEA: false
  },
  {
    name: 'Finland',
    EEA: true
  },
  {
    name: 'France',
    EEA: true
  },
  {
    name: 'French Polynesia',
    EEA: false
  },
  {
    name: 'French West Indies',
    EEA: false
  },
  {
    name: 'Gabon',
    EEA: false
  },
  {
    name: 'Gambia',
    EEA: false
  },
  {
    name: 'Georgia',
    EEA: false
  },
  {
    name: 'Germany',
    EEA: true
  },
  {
    name: 'Ghana',
    EEA: false
  },
  {
    name: 'Gibraltar',
    EEA: false
  },
  {
    name: 'Greece',
    EEA: true
  },
  {
    name: 'Greenland',
    EEA: false
  },
  {
    name: 'Grenada',
    EEA: false
  },
  {
    name: 'Guam',
    EEA: false
  },
  {
    name: 'Guatemala',
    EEA: false
  },
  {
    name: 'Guernsey',
    EEA: false
  },
  {
    name: 'Guinea',
    EEA: false
  },
  {
    name: 'Guinea Bissau',
    EEA: false
  },
  {
    name: 'Guyana',
    EEA: false
  },
  {
    name: 'Haiti',
    EEA: false
  },
  {
    name: 'Honduras',
    EEA: false
  },
  {
    name: 'Hong Kong',
    EEA: false
  },
  {
    name: 'Hungary',
    EEA: true
  },
  {
    name: 'Iceland',
    EEA: true
  },
  {
    name: 'India',
    EEA: false
  },
  {
    name: 'Indonesia',
    EEA: false
  },
  {
    name: 'Iran',
    EEA: false
  },
  {
    name: 'Iraq',
    EEA: false
  },
  {
    name: 'Ireland',
    EEA: true
  },
  {
    name: 'Isle of Man',
    EEA: false
  },
  {
    name: 'Israel',
    EEA: false
  },
  {
    name: 'Italy',
    EEA: true
  },
  {
    name: 'Jamaica',
    EEA: false
  },
  {
    name: 'Japan',
    EEA: false
  },
  {
    name: 'Jersey',
    EEA: false
  },
  {
    name: 'Jordan',
    EEA: false
  },
  {
    name: 'Kazakhstan',
    EEA: false
  },
  {
    name: 'Kenya',
    EEA: false
  },
  {
    name: 'Kuwait',
    EEA: false
  },
  {
    name: 'Kyrgyz Republic',
    EEA: false
  },
  {
    name: 'Laos',
    EEA: false
  },
  {
    name: 'Latvia',
    EEA: true
  },
  {
    name: 'Lebanon',
    EEA: false
  },
  {
    name: 'Lesotho',
    EEA: false
  },
  {
    name: 'Liberia',
    EEA: false
  },
  {
    name: 'Libya',
    EEA: false
  },
  {
    name: 'Liechtenstein',
    EEA: true
  },
  {
    name: 'Lithuania',
    EEA: true
  },
  {
    name: 'Luxembourg',
    EEA: true
  },
  {
    name: 'Macau',
    EEA: false
  },
  {
    name: 'Macedonia',
    EEA: false
  },
  {
    name: 'Madagascar',
    EEA: false
  },
  {
    name: 'Malawi',
    EEA: false
  },
  {
    name: 'Malaysia',
    EEA: false
  },
  {
    name: 'Maldives',
    EEA: false
  },
  {
    name: 'Mali',
    EEA: false
  },
  {
    name: 'Malta',
    EEA: true
  },
  {
    name: 'Mauritania',
    EEA: false
  },
  {
    name: 'Mauritius',
    EEA: false
  },
  {
    name: 'Mexico',
    EEA: false
  },
  {
    name: 'Moldova',
    EEA: false
  },
  {
    name: 'Monaco',
    EEA: false
  },
  {
    name: 'Mongolia',
    EEA: false
  },
  {
    name: 'Montenegro',
    EEA: false
  },
  {
    name: 'Montserrat',
    EEA: false
  },
  {
    name: 'Morocco',
    EEA: false
  },
  {
    name: 'Mozambique',
    EEA: false
  },
  {
    name: 'Namibia',
    EEA: false
  },
  {
    name: 'Nepal',
    EEA: false
  },
  {
    name: 'Netherlands',
    EEA: true
  },
  {
    name: 'New Caledonia',
    EEA: false
  },
  {
    name: 'New Zealand',
    EEA: false
  },
  {
    name: 'Nicaragua',
    EEA: false
  },
  {
    name: 'Niger',
    EEA: false
  },
  {
    name: 'Nigeria',
    EEA: false
  },
  {
    name: 'Norway',
    EEA: true
  },
  {
    name: 'Oman',
    EEA: false
  },
  {
    name: 'Pakistan',
    EEA: false
  },
  {
    name: 'Palestine',
    EEA: false
  },
  {
    name: 'Panama',
    EEA: false
  },
  {
    name: 'Papua New Guinea',
    EEA: false
  },
  {
    name: 'Paraguay',
    EEA: false
  },
  {
    name: 'Peru',
    EEA: false
  },
  {
    name: 'Philippines',
    EEA: false
  },
  {
    name: 'Poland',
    EEA: true
  },
  {
    name: 'Portugal',
    EEA: true
  },
  {
    name: 'Puerto Rico',
    EEA: false
  },
  {
    name: 'Qatar',
    EEA: false
  },
  {
    name: 'Republic of Cyprus',
    EEA: true
  },
  {
    name: 'Reunion',
    EEA: false
  },
  {
    name: 'Romania',
    EEA: true
  },
  {
    name: 'Russia',
    EEA: false
  },
  {
    name: 'Rwanda',
    EEA: false
  },
  {
    name: 'Saint Pierre & Miquelon',
    EEA: false
  },
  {
    name: 'Samoa',
    EEA: false
  },
  {
    name: 'San Marino',
    EEA: false
  },
  {
    name: 'Satellite',
    EEA: false
  },
  {
    name: 'Saudi Arabia',
    EEA: false
  },
  {
    name: 'Senegal',
    EEA: false
  },
  {
    name: 'Serbia',
    EEA: false
  },
  {
    name: 'Seychelles',
    EEA: false
  },
  {
    name: 'Sierra Leone',
    EEA: false
  },
  {
    name: 'Singapore',
    EEA: false
  },
  {
    name: 'Slovakia',
    EEA: true
  },
  {
    name: 'Slovenia',
    EEA: true
  },
  {
    name: 'South Africa',
    EEA: false
  },
  {
    name: 'South Korea',
    EEA: false
  },
  {
    name: 'Spain',
    EEA: true,
    aliases: ['España'],
  },
  {
    name: 'Sri Lanka',
    EEA: false
  },
  {
    name: 'St Kitts & Nevis',
    EEA: false
  },
  {
    name: 'St Lucia',
    EEA: false
  },
  {
    name: 'St Vincent',
    EEA: false
  },
  {
    name: 'St. Lucia',
    EEA: false
  },
  {
    name: 'Sudan',
    EEA: false
  },
  {
    name: 'Suriname',
    EEA: false
  },
  {
    name: 'Swaziland',
    EEA: false
  },
  {
    name: 'Sweden',
    EEA: true
  },
  {
    name: 'Switzerland',
    EEA: false,
    aliases: ['Swiss Confederation', 'Schweiz', 'Suisse', 'Svizzera', 'Svizra'],
  },
  {
    name: 'Syria',
    EEA: false
  },
  {
    name: 'Taiwan',
    EEA: false
  },
  {
    name: 'Tajikistan',
    EEA: false
  },
  {
    name: 'Tanzania',
    EEA: false
  },
  {
    name: 'Thailand',
    EEA: false
  },
  {
    name: 'Timor L’Este',
    EEA: false
  },
  {
    name: 'Togo',
    EEA: false
  },
  {
    name: 'Tonga',
    EEA: false
  },
  {
    name: 'Trinidad & Tobago',
    EEA: false
  },
  {
    name: 'Tunisia',
    EEA: false
  },
  {
    name: 'Turkey',
    EEA: false
  },
  {
    name: 'Turkmenistan',
    EEA: false
  },
  {
    name: 'Turks & Caicos',
    EEA: false
  },
  {
    name: 'Uganda',
    EEA: false
  },
  {
    name: 'Ukraine',
    EEA: false
  },
  {
    name: 'United Arab Emirates',
    EEA: false
  },
  {
    name: 'United Kingdom',
    aliases: ['Great Britain', 'England', 'UK', 'Wales', 'Scotland', 'Northern Ireland'],
    EEA: true
  },
  {
    name: 'Uruguay',
    EEA: false
  },
  {
    name: 'Uzbekistan',
    EEA: false
  },
  {
    name: 'Venezuela',
    EEA: false
  },
  {
    name: 'Vietnam',
    EEA: false
  },
  {
    name: 'Virgin Islands (US)',
    EEA: false
  },
  {
    name: 'Yemen',
    EEA: false
  },
  {
    name: 'Zambia',
    EEA: false
  },
  {
    name: 'Zimbabwe',
    EEA: false
  },
];

module.exports = {
  list: list,

  // Filter by EEA
  listByEEA: function() {

    return list.filter(function(country) {
      return country.EEA;
    });
  },

  // Filter by non-EEA
  listByNonEEA: function() {

    return list.filter(function(country) {
      return !country.EEA;
    });
  }
};
