import { Table, Column, TableRelation } from './types/common'
import { SDL, GQLType, GQLField } from './types/graphql'
import * as _ from 'lodash'

export class SDLInferrer {
  infer(dbTables: Table[]): SDL {
    const typeCandidates = dbTables.filter(t => !t.isJoinTable())
    const joinTables = dbTables.filter(t => t.isJoinTable())

    // Assemble basic types
    const types = typeCandidates.map(tc => {
      // tc.columns.some(f => f.isPrimaryKey)

      const name = this.capitalizeFirstLetter(tc.name)
      const directives = [`@pgTable("${tc.name}")`]
      const fields: GQLField[] = []
      
      // const relations = tc.relations

      return new GQLType(name, fields, directives, false)
    })

    return new SDL(types)
  }

  printType(table: Table, otherTables: Table[]) {
    const nativeFields = table.columns
    // const filterFunction = c => c.relation !== null && c.relation.table == table.name
    // const relationFields = otherTables
    //   .filter(t => t.columns.some(filterFunction))
    //   .map(t =>
    //     t.columns
    //       .filter(filterFunction)
    //       .map(c => ({ remoteColumn: c, remoteTable: t }))
    //   )
    //   .reduce((acc, next) => acc.concat(next), [])

    const raw = `type ${this.capitalizeFirstLetter(table.name)} @pgTable(name: "${table.name}") {
  ${(_.map(nativeFields, nativeField => this.printField(nativeField))/*.concat(relationFields.map(field => this.printBackRelationField(field)))*/).join('\n  ')}
}
`

    // if (table.hasPrimaryKey) {
    //   return raw
    // } else {
    const commented = raw.split(/\r?\n/).map(line => { return line.length > 0 ? `// ${line}` : "" }).join("\n")
    return `// Types without primary key not yet supported\n${commented}`
    // }
  }

  // printBackRelationField(field: RelationField) {
  //   if (field.remoteTable.isJunctionTable) {
  //     const otherRemoteTableField = field.remoteTable.columns.filter(
  //       x => x.name !== field.remoteColumn.name
  //     )[0]
  //     const relatedTable = (otherRemoteTableField.relation as Relation).table

  //     return `${this.lowerCaseFirstLetter(
  //       relatedTable
  //     )}s: [${this.capitalizeFirstLetter(
  //       relatedTable
  //     )}!]! @pgRelationTable(table: "${field.remoteTable.name}" name: "${
  //       field.remoteTable.name
  //       }")`
  //   } else {
  //     return `${field.remoteTable.name}s: [${this.capitalizeFirstLetter(
  //       field.remoteTable.name
  //     )}!]!`
  //   }
  // }

  printField(column: Column) {
    const field = `${this.printFieldName(column)}: ${this.printFieldType(
      column
    )}${this.printFieldOptional(column)}${this.printRelationDirective(
      column
    )}${this.printFieldDirectives(column)}${
      column.comment === null ? "" : ` # ${column.comment}`}`

    if (column.typeIdentifier === null) {
      return `# ${field}`
    }

    return field
  }

  printFieldName(column: Column) {
    // if (column.relation !== null) {
    //   return this.removeIdSuffix(column.name)
    // } else if (column.isPrimaryKey) {
    // return "id"
    // } else {
    return column.name
    // }
  }

  printFieldType(column: Column) {
    // if (column.relation !== null) {
    // return this.capitalizeFirstLetter(column.relation.target_table)
    // } else {
    return column.typeIdentifier
    // }
  }

  printRelationDirective(column: Column) {
    // if (column.relation !== null) {
    // return ` @pgRelation(column: "${column.name}")`
    // } else {
    return ''
    // }
  }

  printFieldOptional(column: Column) {
    return column.nullable ? '' : '!'
  }

  printFieldDirectives(column: Column) {
    let directives = ''
    if (column.isUnique) {
      directives += ` @unique`
    }

    if (column.isPrimaryKey && column.name != "id") {
      directives += ` @pgColumn(name: "${column.name}")`
    }

    if (column.defaultValue != null) {
      if (column.defaultValue == '[AUTO INCREMENT]') {
        return directives
      }

      if (
        column.typeIdentifier == 'String' ||
        column.typeIdentifier == 'DateTime' ||
        column.typeIdentifier == 'Json'
      ) {
        directives += ` @default(value: "${column.defaultValue}")`
      } else {
        directives += ` @default(value: ${column.defaultValue})`
      }
    }

    return directives
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  lowerCaseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1)
  }

  removeIdSuffix(string) {
    function removeSuffix(suffix, string) {
      if (string.endsWith(suffix)) {
        return string.substring(0, string.length - suffix.length)
      } else {
        return string
      }
    }

    return removeSuffix('_ID', removeSuffix('_id', removeSuffix('Id', string)))
  }
}