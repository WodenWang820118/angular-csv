import { Component, ViewChild } from '@angular/core';
import { FormControl, NgForm } from '@angular/forms';
import { PairForm } from '../../interface/pairForm';
import { fields } from 'src/app/fields';
import { ValueBindingService } from '../../service/valueBinding.service';
import { ValueSyncService } from 'src/app/service/valueSync.service';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent {
  @ViewChild('table') table!: MatTable<PairForm>;
  selectedField = new FormControl();
  selectedCell = new FormControl();
  fields: string[] = fields;
  displayedColumns: string[] = ['label', 'cell', 'value'];
  pairForms: PairForm[] = [];

  constructor(public vbService: ValueBindingService, private vsService: ValueSyncService) {
    this.vbService.initCharHash();

    // retrieve the pairForms from the server at the first time
    this.vsService.getPairFormsFromServer().subscribe(pairForms => {
      console.log(`update data from the server`);
      this.pairForms = pairForms;
    })

    this.vsService.getPairFormsSubject().subscribe(pairForms => {
      console.log(`update data from the table to HTML form`);
      this.pairForms = pairForms;
    })
  }

  onSubmit(f: NgForm): void {
    let field = f.controls['selectedField'].value;
    let cell = f.controls['selectedCell'].value;

    if (this.vbService.verifyCell(cell)) {
      let coordinate = this.vbService.convertCellToCoordinate(cell);
      let newBinding: PairForm = {
        label: field,
        cell: cell,
        coordinate: coordinate,
        value: 0
      }
      this.saveBindingInfo(newBinding);
    } else {
      return
    }
  }
  
  saveBindingInfo(newBinding: PairForm): void {
    if (this.pairForms.length === 0) {
      this.addPairFormToServer(newBinding);
    } else {
      for (let p of this.pairForms) {
        // won't save the data with the same label and the same cell
        if (p.label === newBinding.label && p.cell === newBinding.cell) {
          return
        } else if (p.label === newBinding.label && p.cell !== newBinding.cell) {
          p.cell = newBinding.cell;
          return
        } else {
          // different label with the same cell
          // different label with different cell
          this.addPairFormToServer(newBinding);
          return
        }
      }
    }
  }

  addPairFormToServer(newBinding: PairForm): void {
    console.log(`add the new binding to the server`);
    // save the new binding to the server
    this.vsService.addPairForm(newBinding)
      .subscribe(() => {
        // push the new binding to the pairForms and re-render rows
        this.pairForms.push(newBinding);
        this.table ? this.table.renderRows() : '';
      }
    );
  }

  deleteRow(row: PairForm): void {
    console.log(`Trigger the delete function`);
    // delete the row from the server
    this.vsService.deletePairForm(row)
      .subscribe(() => {
        // delete the row from the pairForms
        this.pairForms = this.pairForms.filter(p => p.label !== row.label);
      }
    );
  }
}
